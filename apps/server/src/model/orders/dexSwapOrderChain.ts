import { Output, TransactionWithStatus, SwapOrderCellArgs, CellInfoSerializationHolderFactory } from '..';
import { CKB_TOKEN_TYPE_HASH } from '../../config';
import { BridgeInfo } from '../bridge';
import { Token, TokenHolderFactory } from '../tokens';
import { DexOrderChain, OrderHistory, Step } from './dexOrderChain';
import { CKB_TYPE_HASH, MIN_SUDT_CAPACITY } from '@gliaswap/constants';

export enum ORDER_TYPE {
  SellCKB = 0,
  BuyCKB = 1,
}

const enum ORDER_STATUS {
  PENDING = 'pending',
  OPEN = 'open',
  COMPLETED = 'completed',
  CANCELING = 'canceling',
}

enum OrderType {
  CrossChain = 'CrossChain',
  CrossChainOrder = 'CrossChainOrder',
  Order = 'Order',
}

export class DexSwapOrderChain extends DexOrderChain {
  constructor(
    cell: Output,
    data: string,
    tx: TransactionWithStatus,
    index: number,
    live: boolean,
    nextOrderCell: DexOrderChain,
    private readonly _isIn?: boolean,
    private readonly _isOrder?: boolean,
    private readonly _bridgeInfo?: BridgeInfo,
  ) {
    super(cell, data, tx, index, nextOrderCell, live);
  }

  getOrderHistory(): OrderHistory {
    const transactionHash = this.getLastOrder().getTxHash();
    const argsData = this.getArgsData();

    const ckbToken = TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH);
    const sudtToken = TokenHolderFactory.getInstance().getTokenByTypeHash(this.cell.type.toHash());

    let amountIn;
    let amountOut;
    if (!this._isOrder && this._bridgeInfo) {
      if (this._isIn) {
        amountIn = new Token(null, null, sudtToken.shadowFrom, null, null);
        amountOut = sudtToken;
        amountIn.balance = this._bridgeInfo.amount;
        amountOut.balance = this._bridgeInfo.amount;
      } else {
        amountIn = sudtToken;
        amountOut = new Token(null, null, sudtToken.shadowFrom, null, null);
        amountIn.balance = this._bridgeInfo.amount;
        amountOut.balance = this._bridgeInfo.amount;
      }
    } else {
      amountIn = argsData.sudtTypeHash == CKB_TYPE_HASH ? sudtToken : ckbToken;
      amountOut = argsData.sudtTypeHash == CKB_TYPE_HASH ? ckbToken : sudtToken;
      if (argsData.sudtTypeHash == CKB_TYPE_HASH) {
        // sudt => ckb
        amountIn.balance = this._isOrder === false ? this._bridgeInfo.amount : this.getData().toString();
      } else {
        // ckb => sudt
        amountIn.balance =
          this._isOrder === false
            ? this._bridgeInfo.amount
            : (BigInt(this.cell.capacity) - MIN_SUDT_CAPACITY).toString();
      }
      amountOut.balance = argsData.amountOutMin.toString();
    }

    const steps = this.buildStep();
    const status = this.getStatus();
    const timestamp = this.tx.txStatus.timestamp;
    const type = this.getType();

    const orderHistory: OrderHistory = {
      transactionHash: transactionHash,
      timestamp: timestamp,
      amountIn: amountIn,
      amountOut: amountOut,
      stage: {
        status: status,
        steps: steps,
      },
      type: type,
    };

    return orderHistory;
  }

  getArgsData(): SwapOrderCellArgs {
    if (!this._isOrder && this._bridgeInfo) {
      return null;
    }
    return CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().decodeArgs(this.cell.lock.args);
  }

  getData(): bigint {
    return CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().decodeData(this.data);
  }

  getType(): string {
    if (this._isOrder) {
      return OrderType.CrossChainOrder;
    }

    if (this._bridgeInfo) {
      return OrderType.CrossChain;
    }

    return OrderType.Order;
  }

  getStatus(): string {
    const orders = this.getOrders();
    if (this._isOrder || !this._bridgeInfo) {
      if (orders.length === 1) {
        if (this.tx.txStatus.status === 'pending') {
          return ORDER_STATUS.PENDING;
        }
        return ORDER_STATUS.OPEN;
      }

      return ORDER_STATUS.COMPLETED;
    }

    return ORDER_STATUS.COMPLETED;
  }

  buildStep(): Step[] {
    const orders = this.getOrders();
    const result: Step[] = [];

    if (this._isIn === false) {
      const step: Step = new Step(this.tx.transaction.hash);
      result.push(step);
      result.push(step);

      const stepEth: Step = new Step(this._bridgeInfo.eth_tx_hash);
      result.push(stepEth);

      return result;
    }

    if (this._isIn) {
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
}
