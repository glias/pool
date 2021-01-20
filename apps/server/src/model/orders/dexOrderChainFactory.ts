import { BridgeInfoMatchChain, Input, Script, TransactionWithStatus } from '..';
import { DexOrderChain } from './dexOrderChain';

export class DexOrderChainFactory {
  private inputOutPointWithTransaction: Map<string, TransactionWithStatus>;

  private orderCells: DexOrderChain[];

  private readonly markTheCellThatHasBeenTracked: Set<string> = new Set();

  getOrderChains(
    lock: Script,
    type: Script,
    transactionCollector: TransactionWithStatus[],
    bridgeInfoMatch: BridgeInfoMatchChain,
  ): DexOrderChain[] {
    const orders = [];

    this.initOrderChainDatas(lock, type, transactionCollector, bridgeInfoMatch);
    this.orderCells.forEach((x) => {
      const inputOutPoint = this.formatOutPoint(x.tx.transaction.hash, x.index);
      if (this.markTheCellThatHasBeenTracked.has(inputOutPoint)) {
        return;
      }

      const order = this.buildOrderChain(x);
      orders.push(order);
    });

    return orders;
  }

  buildOrderChain(orderCell: DexOrderChain): DexOrderChain {
    const inputOutPoint = this.formatOutPoint(orderCell.tx.transaction.hash, orderCell.index);
    this.markTheCellThatHasBeenTracked.add(inputOutPoint);

    const nextTx = this.inputOutPointWithTransaction.get(inputOutPoint);
    if (!nextTx) {
      orderCell.live = true;
      return orderCell;
    }

    const nextCell = this.matchNextOrderCell(nextTx, inputOutPoint);
    orderCell.nextOrderCell = nextCell;
    if (!this.nextCellIsOrderCell(orderCell, nextCell)) {
      return orderCell;
    }

    this.buildOrderChain(nextCell);
    return orderCell;
  }

  private nextCellIsOrderCell(orderCell: DexOrderChain, nextCell: DexOrderChain): boolean {
    return orderCell.equals(nextCell);
  }

  private matchNextOrderCell(nextTx: TransactionWithStatus, targetInputOutPoint: string): DexOrderChain {
    const index = this.matchIndexOfInputInArray(nextTx.transaction.inputs, targetInputOutPoint);
    const output = nextTx.transaction.outputs[index];
    const data = nextTx.transaction.outputsData[index];

    return new DexOrderChain(output, data, nextTx, index, null);
  }

  private matchIndexOfInputInArray(inputs: Input[], targetInputOutPoint: string): number {
    for (let i = 0; i < inputs.length; i++) {
      const { txHash, index } = inputs[i].previousOutput;
      const inputOutPoint = this.formatOutPoint(txHash, parseInt(index, 16));
      if (inputOutPoint === targetInputOutPoint) {
        return i;
      }
    }
  }

  private initOrderChainDatas(
    lock: Script,
    type: Script,
    transactionCollector: TransactionWithStatus[],
    bridgeInfoMatch: BridgeInfoMatchChain,
  ): void {
    const inputOutPointWithTransaction: Map<string, TransactionWithStatus> = new Map();
    const orderCells: DexOrderChain[] = [];

    transactionCollector.forEach((x) => {
      x.transaction.inputs.forEach((input) => {
        const key = this.formatOutPoint(input.previousOutput.txHash, parseInt(input.previousOutput.index, 16));
        inputOutPointWithTransaction.set(key, x);
      });

      x.transaction.outputs.forEach((output, index) => {
        if (type && !output.type) {
          return;
        }

        if (
          output.lock.codeHash === lock.codeHash &&
          output.lock.hashType === lock.hashType &&
          output.type.codeHash === type.codeHash &&
          output.type.hashType === type.hashType &&
          output.type.args === type.args
        ) {
          const data = x.transaction.outputsData[index];
          const bridgeInfoResult = bridgeInfoMatch.match(x.transaction.hash);
          const isIn = bridgeInfoResult ? bridgeInfoResult.isIn : null;
          const isOrder = bridgeInfoResult ? bridgeInfoResult.isOrder : null;
          const bridgeInfo = bridgeInfoResult ? bridgeInfoResult.bridgeInfo : null;

          orderCells.push(new DexOrderChain(output, data, x, index, null, isIn, isOrder, bridgeInfo));
        }
      });
    });

    this.inputOutPointWithTransaction = inputOutPointWithTransaction;
    this.orderCells = orderCells;
  }

  formatOutPoint(txHash: string, index: number): string {
    return `${txHash}:${index.toString(16)}`;
  }
}
