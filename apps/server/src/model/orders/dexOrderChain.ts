import { Script, Output, TransactionWithStatus } from '..';
import { SwapOrderCellArgs, SwapOrderCellInfoSerialization } from '../data';
import { Token, TokenTokenHolderFactory } from '../tokens';

const LIQUIDITY_ORDER_CELL_ARGS_LENGHT = 172;
const SWAP_ORDER_CELL_ARGS_LENGHT = 134;
const CKB_TYPE_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

const enum PLACE_ORDER_TYPE {
  LIQUIDITY = 'LIQUIDITY',
  SWAP = 'SWAP',
}

export enum ORDER_TYPE {
  SellCKB = 0,
  BuyCKB = 1,
}

export interface Stage {
  status: string
  steps: Step[]
}

export interface Step {
  transactionHash: string;
  index: string;
  errorMessage: string;
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

  getOrderInfo(): OrderHistory {
    const lastOrder = this.getLastOrder()
    const transactionHash = lastOrder.tx.transaction.hash;
    const argsData = this.getArgsData();
    const ckbToken = TokenTokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TYPE_HASH);
    const sudtToken = TokenTokenHolderFactory.getInstance().getTokenByTypeHash(this.cell.type.toHash())
    let amountIn, amountOut;
    if(argsData.orderType === ORDER_TYPE.BuyCKB) {
      amountIn = ckbToken;
      amountOut = sudtToken;
    } else {
      amountIn = sudtToken;
      amountOut = ckbToken;
    }

    amountIn.balance = argsData.amountIn;
    amountOut.balance = argsData.minAmountOut;

    const orderHistory: OrderHistory = {
      transactionHash: transactionHash,
      timestamp: this.tx.txStatus.timestamp!,
      amountIn: amountIn,
      amountOut: amountOut,
      stage: {
        status: "",
        steps: []
      },
      type: "123"
    } 
    
    

    return orderHistory;

  }

  getArgsData(): SwapOrderCellArgs {
    if(PLACE_ORDER_TYPE.SWAP === this.getOrderType()) {
     return SwapOrderCellInfoSerialization.decodeArgs(this.cell.lock.args)
    }
  }

  getData(): bigint {
    if(PLACE_ORDER_TYPE.SWAP === this.getOrderType()) {
      return SwapOrderCellInfoSerialization.decodeData(this.cell.lock.args)
    }
  }

  getOrderType(): string {
    console.log(this.cell.lock.args.length);
    
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
}
