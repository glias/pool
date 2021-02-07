import { Output, TransactionWithStatus, SwapOrderCellArgs, CellInfoSerializationHolderFactory } from '..';
import { CKB_TOKEN_TYPE_HASH } from '../../config';
import { BridgeInfo } from '../bridge';
import { TokenHolderFactory } from '../tokens';
import { DexOrderChain, OrderHistory, ORDER_STATUS, Step } from './dexOrderChain';
import { CKB_TYPE_HASH, MIN_SUDT_CAPACITY } from '@gliaswap/constants';

export enum ORDER_TYPE {
  SellCKB = 0,
  BuyCKB = 1,
}

export enum SwapOrderType {
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

    let amountIn;
    let amountOut;
    if (!this._isOrder && this._bridgeInfo) {
      const token = TokenHolderFactory.getInstance().getTokenByShadowFromAddress(this._bridgeInfo.token_addr);

      if (this._isIn) {
        amountIn = token.toERC20Token();
        amountOut = token;
        amountIn.balance = this._bridgeInfo.amount;
        amountOut.balance = this._bridgeInfo.amount;
      } else {
        amountIn = token;
        amountOut = token.toERC20Token();
        amountIn.balance = this._bridgeInfo.amount;
        amountOut.balance = this._bridgeInfo.amount;
      }
    } else {
      const argsData = this.getArgsData();
      const ckbToken = TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH);
      const sudtToken = TokenHolderFactory.getInstance().getTokenByTypeHash(
        argsData.sudtTypeHash === CKB_TOKEN_TYPE_HASH ? this.cell.type.toHash() : argsData.sudtTypeHash,
      );

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
      return SwapOrderType.CrossChainOrder;
    }

    if (this._bridgeInfo) {
      return SwapOrderType.CrossChain;
    }

    return SwapOrderType.Order;
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

      if (this.getLastOrder().tx.txStatus.status === 'pending') {
        return ORDER_STATUS.OPEN;
      }

      return ORDER_STATUS.COMPLETED;
    }

    return ORDER_STATUS.COMPLETED;
  }

  buildStep(): Step[] {
    const orders = this.getOrders();
    const result: Step[] = [];

    if (this.getType() === SwapOrderType.CrossChain) {
      const ethStep: Step = new Step(this._bridgeInfo.eth_tx_hash);
      const ckbStep: Step = new Step(this._bridgeInfo.ckb_tx_hash);
      if (this._isIn) {
        result.push(ethStep);
        result.push(ethStep);
        result.push(ckbStep);
      } else {
        result.push(ckbStep);
        result.push(ckbStep);
        result.push(ethStep);
      }

      return result;
    }

    if (this.getType() === SwapOrderType.CrossChainOrder) {
      const ethStep: Step = new Step(this._bridgeInfo.eth_tx_hash);
      result.push(ethStep);
      result.push(ethStep);
    }

    if (this.getType() === SwapOrderType.Order) {
      const step: Step = new Step(this.tx.transaction.hash, this.index.toString());
      result.push(step);
    }

    orders.forEach((x) => {
      const step: Step = new Step(x.tx.transaction.hash, x.index.toString());
      result.push(step);
    });

    return result;
  }

  filterOrderHistory(): boolean {
    if (SwapOrderType.Order === this.getType()) {
      if (this.getStatus() !== ORDER_STATUS.COMPLETED && this.getStatus() !== ORDER_STATUS.CANCELING) {
        return true;
      }
    }

    if (SwapOrderType.CrossChainOrder === this.getType()) {
      if (this.getStatus() === ORDER_STATUS.PENDING) {
        return false;
      }

      if (this.getStatus() !== ORDER_STATUS.COMPLETED && this.getStatus() !== ORDER_STATUS.CANCELING) {
        return true;
      }
    }

    if (SwapOrderType.CrossChain === this.getType()) {
      if (this.getStatus() === ORDER_STATUS.COMPLETED) {
        return true;
      }
      return false;
    }

    return false;
  }
}
