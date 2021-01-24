import {
  Output,
  TransactionWithStatus,
  CellInfoSerializationHolderFactory,
  LiquidityOrderCellArgs,
  LIQUIDITY_ORDER_LOCK_SCRIPT,
} from '..';
import { CKB_TOKEN_TYPE_HASH } from '../../config';
import { TokenHolderFactory } from '../tokens';
import { DexOrderChain, OrderHistory, Step } from './dexOrderChain';

export enum ORDER_TYPE {
  add = 'add',
  remove = 'remove',
}

const enum ORDER_STATUS {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELING = 'canceling',
}

export class DexLiquidityChain extends DexOrderChain {
  constructor(
    cell: Output,
    data: string,
    tx: TransactionWithStatus,
    index: number,
    live: boolean,
    nextOrderCell: DexOrderChain,
  ) {
    super(cell, data, tx, index, nextOrderCell, live);
  }

  getOrderHistory(): OrderHistory {
    const transactionHash = this.getLastOrder().getTxHash();
    const argsData = this.getArgsData();
    const ckbToken = TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH);
    const sudtToken = TokenHolderFactory.getInstance().getTokenByTypeHash(argsData.infoTypeHash);
    const amountA = ckbToken;
    const amountB = sudtToken;

    amountA.balance = argsData.amount0.toString();
    amountB.balance = argsData.amount1.toString();
    const steps = this.buildStep();
    const status = this.getStatus();

    const orderHistory: OrderHistory = {
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
      return ORDER_TYPE.add;
    }

    return ORDER_TYPE.remove;
  }

  getStatus(): string {
    const order = this.getLastOrder();
    if (order.cell.lock.codeHash === LIQUIDITY_ORDER_LOCK_SCRIPT.codeHash) {
      return ORDER_STATUS.PENDING;
    }

    return ORDER_STATUS.COMPLETED;
  }

  buildStep(): Step[] {
    const orders = this.getOrders();
    const result: Step[] = [];
    orders.forEach((x) => {
      const step: Step = new Step(x.tx.transaction.hash, x.index.toString());
      result.push(step);
    });

    return result;
  }
}
