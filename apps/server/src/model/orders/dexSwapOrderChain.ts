import { Output, TransactionWithStatus, SwapOrderCellArgs, CellInfoSerializationHolderFactory } from '..';
import { CKB_TOKEN_TYPE_HASH, SWAP_ORDER_LOCK_CODE_HASH } from '../../config';
import { BridgeInfo } from '../bridge';
import { TokenHolderFactory } from '../tokens';
import { DexOrderChain, OrderHistory, Step } from './dexOrderChain';
import { CKB_TYPE_HASH, MIN_SUDT_CAPACITY } from '@gliaswap/constants';

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

export class DexSwapOrderChain extends DexOrderChain {
  constructor(
    cell: Output,
    data: string,
    tx: TransactionWithStatus,
    index: number,
    live: boolean,
    nextOrderCell: DexOrderChain,
    // private readonly _isIn?: boolean,
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

    const amountIn = argsData.sudtTypeHash == CKB_TYPE_HASH ? sudtToken : ckbToken;
    const amountOut = argsData.sudtTypeHash == CKB_TYPE_HASH ? ckbToken : sudtToken;

    if (argsData.sudtTypeHash == CKB_TYPE_HASH) {
      // sudt => ckb
      amountIn.balance = this.getData().toString();
    } else {
      // ckb => sudt
      amountIn.balance = (BigInt(this.cell.capacity) - MIN_SUDT_CAPACITY).toString();
    }

    amountOut.balance = argsData.amountOutMin.toString();
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
      OrderType.CrossChain;
    }

    return OrderType.Order;
  }

  getStatus(): string {
    const order = this.getLastOrder();
    if (order.cell.lock.codeHash === SWAP_ORDER_LOCK_CODE_HASH) {
      return ORDER_STATUS.PENDING;
    }

    if (this.getArgsData().sudtTypeHash == CKB_TYPE_HASH) {
      // sudt => ckb
      const income = BigInt(order.cell.capacity) - BigInt(this.cell.capacity);
      if (income < this.getArgsData().amountOutMin) {
        return ORDER_STATUS.CANCELING;
      }
    } else {
      // ckb => sudt
      if (
        CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().decodeData(order.data) <
        this.getArgsData().amountOutMin
      ) {
        return ORDER_STATUS.CANCELING;
      }
    }

    return ORDER_STATUS.COMPLETED;
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
}
