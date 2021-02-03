import { Script, Output, TransactionWithStatus, CellInfoSerializationHolder } from '..';
import { CellInfoSerializationHolderFactory } from '../datas';
import { Token } from '../tokens';

export interface Stage {
  status: string;
  steps: Step[];
}

export const enum ORDER_STATUS {
  PENDING = 'pending',
  OPEN = 'open',
  COMPLETED = 'completed',
  CANCELING = 'canceling',
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
  poolId?: string;
  lpToken?: Token;
  transactionHash: string;
  timestamp?: string;
  amountIn: Token;
  amountOut: Token;
  stage: Stage;
  type: string;
}

export abstract class DexOrderChain {
  constructor(
    private readonly _cell: Output,
    private readonly _data: string,
    private readonly _tx: TransactionWithStatus,
    private readonly _index: number,
    private _nextOrderCell?: DexOrderChain,
    private _live: boolean = false,
  ) {}

  abstract getOrderHistory(): OrderHistory;
  abstract filterOrderHistory(): boolean;
  abstract getType(): string;
  abstract getStatus(): string;

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

  getCellInfoSerializationHolder(): CellInfoSerializationHolder {
    return CellInfoSerializationHolderFactory.getInstance();
  }

  equals(orderCell: DexOrderChain): boolean {
    if (this.cell.type) {
      return (
        this.equalScript(this._cell.lock, orderCell._cell.lock) &&
        this.equalScript(this._cell.type, orderCell._cell.type)
      );
    }

    return this.equalScript(this._cell.lock, orderCell._cell.lock);
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

  equalScript(script1: Script, script2: Script): boolean {
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
