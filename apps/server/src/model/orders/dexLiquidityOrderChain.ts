import {
  Output,
  TransactionWithStatus,
  CellInfoSerializationHolderFactory,
  LiquidityOrderCellArgs,
  PoolInfo,
} from '..';
import { CKB_TOKEN_TYPE_HASH } from '../../config';
import { TokenHolderFactory } from '../tokens';
import { DexOrderChain, OrderHistory, ORDER_STATUS, Step } from './dexOrderChain';
import { MIN_SUDT_CAPACITY } from '@gliaswap/constants';

export enum LIQUIDITY_ORDER_TYPE {
  ADD = 'add',
  REMOVE = 'remove',
}

export class DexLiquidityChain extends DexOrderChain {
  private poolInfo: PoolInfo;
  constructor(
    cell: Output,
    data: string,
    tx: TransactionWithStatus,
    index: number,
    live: boolean,
    nextOrderCell: DexOrderChain,
    poolInfo: PoolInfo,
  ) {
    super(cell, data, tx, index, nextOrderCell, live);
    this.poolInfo = poolInfo;
  }

  getOrderHistory(): OrderHistory {
    const transactionHash = this.getLastOrder().getTxHash();
    const ckbToken = TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH);
    const sudtToken =
      this.getType() === LIQUIDITY_ORDER_TYPE.ADD
        ? TokenHolderFactory.getInstance().getTokenByTypeHash(this.cell.type.toHash())
        : TokenHolderFactory.getInstance().getTokenBySymbol(PoolInfo.getSudtSymbol(this.poolInfo.infoCell));
    const amountA = ckbToken;
    const amountB = sudtToken;

    // FIXME:
    if (this.getType() === LIQUIDITY_ORDER_TYPE.ADD) {
      amountA.balance = (BigInt(this.cell.capacity) - MIN_SUDT_CAPACITY * 2n).toString();
    } else {
      amountA.balance = CellInfoSerializationHolderFactory.getInstance()
        .getLiquidityCellSerialization()
        .decodeArgs(this.cell.lock.args)
        .ckbMin.toString();
    }
    amountB.balance = CellInfoSerializationHolderFactory.getInstance()
      .getLiquidityCellSerialization()
      .decodeData(this.data)
      .toString();
    const steps = this.buildStep();
    const status = this.getStatus();

    const orderHistory: OrderHistory = {
      poolId: PoolInfo.TYPE_SCRIPTS[amountB.info.symbol].toHash(),
      transactionHash: transactionHash,
      timestamp: this.tx.txStatus.timestamp,
      amountIn: amountA,
      amountOut: amountB,
      stage: {
        status: status,
        steps: steps,
      },
      type: this.getType(),
    };

    return orderHistory;
  }

  getArgsData(): LiquidityOrderCellArgs {
    return CellInfoSerializationHolderFactory.getInstance()
      .getLiquidityCellSerialization()
      .decodeArgs(this.cell.lock.args);
  }

  getData(): bigint {
    return CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().decodeData(this.data);
  }

  getType(): string {
    const token = TokenHolderFactory.getInstance()
      .getTokens()
      .find((x) => x.typeHash === this.cell.type.toHash());
    if (token) {
      return LIQUIDITY_ORDER_TYPE.ADD;
    }

    return LIQUIDITY_ORDER_TYPE.REMOVE;
  }

  getStatus(): string {
    if (this.isCancel()) {
      if (this.getLastOrder().tx.txStatus.status === 'pending') {
        return ORDER_STATUS.CANCELING;
      } else {
        return ORDER_STATUS.CANCELED;
      }
    }

    const orders = this.getOrders();

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

  buildStep(): Step[] {
    const orders = this.getOrders();
    const result: Step[] = [];
    if (this.tx.txStatus.status !== 'pending') {
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
    if (this.getStatus() !== ORDER_STATUS.COMPLETED && this.getStatus() !== ORDER_STATUS.CANCELED) {
      return true;
    }
    return false;
  }
}
