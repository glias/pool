import { Script, Output, TransactionWithStatus, SwapOrderCellArgs, CellInfoSerializationHolderFactory } from '..';
import { SWAP_ORDER_LOCK_CODE_HASH } from '../../config';
import { BridgeInfo } from '../bridge';
import { Token, TokenTokenHolderFactory } from '../tokens';

const LIQUIDITY_ORDER_CELL_ARGS_LENGHT = 172;
const SWAP_ORDER_CELL_ARGS_LENGHT = 134;
const CKB_TYPE_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

const enum PLACE_ORDER_TYPE {
  LIQUIDITY = 'LIQUIDITY',
  SWAP = 'SWAP',
}

export enum ORDER_TYPE {
  SellCKB = 0,
  BuyCKB = 1,
}

const enum ORDER_STATUS {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELING = 'canceling',
}

enum OrderType {
  CrossChain = 'CrossChain',
  CrossChainOrder = 'CrossChainOrder',
  Order = 'Order',
}

export interface Stage {
  status: string;
  steps: Step[];
}

export class Step {
  transactionHash: string;
  index?: string;
  errorMessage?: string;
  constructor(transactionHash: string, index?: string, errorMessage?: string) {
    this.transactionHash = transactionHash;
    this.index = index;
    this.errorMessage = errorMessage;
  }
}

export interface OrderHistory {
  transactionHash: string;
  timestamp?: string;
  amountIn: Token;
  amountOut: Token;
  stage: Stage;
  type: string;
}

export class DexOrderChain {
  constructor(
    private readonly _cell: Output,
    private readonly _data: string,
    private readonly _tx: TransactionWithStatus,
    private readonly _index: number,
    private _nextOrderCell: DexOrderChain,
    private _isIn?: boolean,
    private _isOrder?: boolean,
    private _bridgeInfo?: BridgeInfo,
    private _live: boolean = false,
  ) {}

  getLiveCell(): DexOrderChain {
    const cell = this.getLastOrder();
    if (cell.live) {
      return cell;
    }

    return null;
  }

  getTopOrder(): DexOrderChain {
    const orders = this.getOrders();
    return orders[0];
  }

  getLastOrder(): DexOrderChain {
    const orders = this.getOrders();
    return orders[orders.length - 1];
  }

  getTxHash(): string {
    return this.tx.transaction.hash;
  }

  getOrderHistory(): OrderHistory {
    const transactionHash = this.getLastOrder().getTxHash();
    const argsData = this.getArgsData();
    const ckbToken = TokenTokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TYPE_HASH);
    const sudtToken = TokenTokenHolderFactory.getInstance().getTokenByTypeHash(this.cell.type.toHash());
    const amountIn = argsData.orderType === ORDER_TYPE.BuyCKB ? ckbToken : sudtToken;
    const amountOut = argsData.orderType === ORDER_TYPE.BuyCKB ? sudtToken : ckbToken;

    amountIn.balance = argsData.amountIn.toString();
    amountOut.balance = argsData.minAmountOut.toString();
    const steps = this.buildStep();
    const status = this.getStatus();

    const orderHistory: OrderHistory = {
      transactionHash: transactionHash,
      timestamp: this.tx.txStatus.timestamp,
      amountIn: amountIn,
      amountOut: amountOut,
      stage: {
        status: status,
        steps: steps,
      },
      type: this.getType(),
    };

    return orderHistory;
  }

  getArgsData(): SwapOrderCellArgs {
    if (PLACE_ORDER_TYPE.SWAP === this.getPlaceOrderType()) {
      return CellInfoSerializationHolderFactory.getInstance()
        .getSwapCellSerialization()
        .decodeArgs(this.cell.lock.args);
    }
  }

  getData(): bigint {
    return CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().decodeData(this.data);
  }

  getType(): string {
    if (this._isOrder) {
      return OrderType.CrossChainOrder;
    }

    if (this._bridgeInfo) {
      OrderType.CrossChain;
    }

    return OrderType.Order;
  }

  getStatus(): string {
    const order = this.getLastOrder();
    if (order.cell.lock.codeHash === SWAP_ORDER_LOCK_CODE_HASH) {
      return ORDER_STATUS.PENDING;
    }

    if (this.getArgsData().orderType === ORDER_TYPE.BuyCKB) {
      if (order.getData() < this.getArgsData().minAmountOut) {
        return ORDER_STATUS.CANCELING;
      }
    } else {
      const income = BigInt(order.cell.capacity) - BigInt(this.cell.capacity);
      if (income < this.getArgsData().minAmountOut) {
        return ORDER_STATUS.CANCELING;
      }
    }

    return ORDER_STATUS.COMPLETED;
  }

  getPlaceOrderType(): string {
    if (this.cell.lock.args.length === LIQUIDITY_ORDER_CELL_ARGS_LENGHT) {
      return PLACE_ORDER_TYPE.LIQUIDITY;
    }

    if (this.cell.lock.args.length === SWAP_ORDER_CELL_ARGS_LENGHT) {
      return PLACE_ORDER_TYPE.SWAP;
    }
  }

  equals(orderCell: DexOrderChain): boolean {
    return (
      this.equalScript(this._cell.lock, orderCell._cell.lock) && this.equalScript(this._cell.type, orderCell._cell.type)
    );
  }

  getOrders(): DexOrderChain[] {
    const txs = [];
    txs.push(this);

    let cell = this._nextOrderCell;
    while (cell != null) {
      txs.push(cell);
      cell = cell.nextOrderCell;
    }
    return txs;
  }

  buildStep(): Step[] {
    const orders = this.getOrders();
    const result: Step[] = [];
    if (this._bridgeInfo) {
      const step: Step = new Step(this._bridgeInfo.eth_tx_hash);
      result.push(step);
      result.push(step);
    }

    orders.forEach((x) => {
      const step: Step = new Step(x.tx.transaction.hash, x.index.toString());
      result.push(step);
    });

    return result;
  }

  private equalScript(script1: Script, script2: Script): boolean {
    if (!script1 && script2) {
      return false;
    }

    if (script1 && !script2) {
      return false;
    }

    if (
      script1.args !== script2.args ||
      script1.codeHash !== script2.codeHash ||
      script1.codeHash !== script2.codeHash
    ) {
      return false;
    }
    return true;
  }

  get cell(): Output {
    return this._cell;
  }

  get data(): string {
    return this._data;
  }

  get tx(): TransactionWithStatus {
    return this._tx;
  }

  get index(): number {
    return this._index;
  }

  get nextOrderCell(): DexOrderChain {
    return this._nextOrderCell;
  }

  set nextOrderCell(nextOrderCell: DexOrderChain) {
    this._nextOrderCell = nextOrderCell;
  }

  get live(): boolean {
    return this._live;
  }

  set live(live: boolean) {
    this._live = live;
  }
}
