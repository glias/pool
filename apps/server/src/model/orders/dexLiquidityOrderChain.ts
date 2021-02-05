import {
  Output,
  TransactionWithStatus,
  CellInfoSerializationHolderFactory,
  LiquidityOrderCellArgs,
  PoolInfo,
} from '..';
import { CKB_TOKEN_TYPE_HASH, POOL_ID } from '../../config';
import { scriptEquals } from '../scriptEquals';
import { TokenHolderFactory } from '../tokens';
import { DexOrderChain, OrderHistory, ORDER_STATUS, Step } from './dexOrderChain';

export enum LIQUIDITY_ORDER_TYPE {
  add = 'add',
  remove = 'remove',
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
    const argsData = this.getArgsData();
    const ckbToken = TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH);
    const sudtToken =
      this.getType() === LIQUIDITY_ORDER_TYPE.add
        ? TokenHolderFactory.getInstance().getTokenByTypeHash(this.cell.type.toHash())
        : TokenHolderFactory.getInstance().getTokenBySymbol(this.getSudtSymbol());
    const amountA = ckbToken;
    const amountB = sudtToken;

    // FIXME:
    amountA.balance = argsData.ckbMin.toString();
    amountB.balance = argsData.sudtMin.toString();
    const steps = this.buildStep();
    const status = this.getStatus();

    const orderHistory: OrderHistory = {
      poolId: POOL_ID[amountB.info.symbol],
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
      return LIQUIDITY_ORDER_TYPE.add;
    }

    return LIQUIDITY_ORDER_TYPE.remove;
  }

  getStatus(): string {
    if (this.isCancel()) {
      return ORDER_STATUS.CANCELING;
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

  isCancel(): boolean {
    if (this.getOrders().length === 1) {
      return false;
    }

    const last = this.getLastOrder();
    if (last.tx.txStatus.status !== 'pending') {
      return false;
    }

    if (
      !scriptEquals.equalsLockScript(
        last.tx.transaction.inputs[0].cellOutput.lock,
        this.poolInfo.infoCell.cellOutput.lock,
      ) &&
      !scriptEquals.equalsLockScript(
        last.tx.transaction.inputs[0].cellOutput.type,
        this.poolInfo.infoCell.cellOutput.type,
      )
    ) {
      return true;
    }

    return false;
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

  private getSudtSymbol() {
    const infoCellArgs = CellInfoSerializationHolderFactory.getInstance()
      .getLiquidityCellSerialization()
      .decodeArgs(this.cell.lock.args);
    let sudtType = '';
    if (POOL_ID['GLIA'] === infoCellArgs.infoTypeHash) {
      sudtType = 'GLIA';
    }

    if (POOL_ID['ckETH'] === infoCellArgs.infoTypeHash) {
      sudtType = 'ckETH';
    }

    if (POOL_ID['ckDAI'] === infoCellArgs.infoTypeHash) {
      sudtType = 'ckDAI';
    }

    if (POOL_ID['ckUSDC'] === infoCellArgs.infoTypeHash) {
      sudtType = 'ckUSDC';
    }

    if (POOL_ID['ckUSDT'] === infoCellArgs.infoTypeHash) {
      sudtType = 'ckUSDT';
    }
    return sudtType;
  }

  filterOrderHistory(): boolean {
    if (this.getStatus() !== ORDER_STATUS.COMPLETED) {
      return true;
    }
    return false;
  }
}
