import { QueryOptions } from '@ckb-lumos/base';
import { TransactionWithStatus, OutPoint, scriptEquals } from '..';
import { Cell } from '..';

export interface PoolFilter {
  getCellFilter(): CellFilter;
  getTransactionFilter(): TransactionFilter;
}

export interface CellFilter {
  matchCells(queryOptions: QueryOptions, cell: Cell): void;
}

export interface TransactionFilter {
  matchTransactions(): void;
}

export class PendingFilter implements PoolFilter, CellFilter, TransactionFilter {
  constructor(private txs: TransactionWithStatus[]) {}
  matchTransactions(): void {
    throw new Error('Method not implemented.');
  }

  async matchCells(queryOptions: QueryOptions, cell: Cell): Promise<void> {
    const groupByInputOutPoint: Map<string, TransactionWithStatus> = await this.getPoolCells();
    const tx = groupByInputOutPoint.get(this.genKey(cell.outPoint));
    const result: Cell[] = [];
    if (tx) {
      for (let i = 0; i < tx.transaction.outputs.length; i++) {
        const output = tx.transaction.outputs[i];

        if (output.type) {
          if (
            scriptEquals.matchLockScriptWapper(queryOptions.lock, output.lock) &&
            scriptEquals.equalsTypeScript(queryOptions.type, output.type)
          ) {
            const pendingCell: Cell = this.buildPendingCell(cell, tx, i);
            result.push(pendingCell);
          }
        }
      }
    } else {
      result.push(cell);
    }
  }

  private buildPendingCell(cell: Cell, tx: TransactionWithStatus, i: number): Cell {
    return {
      cellOutput: {
        capacity: cell.cellOutput.capacity,
        lock: cell.cellOutput.lock,
        type: cell.cellOutput.type,
      },
      outPoint: cell.outPoint,
      blockHash: tx.txStatus.blockHash,
      blockNumber: '0',
      data: tx.transaction.outputsData[i],
    };
  }

  async getPoolCells(): Promise<Map<string, TransactionWithStatus>> {
    const groupByInputOutPoint = new Map<string, TransactionWithStatus>();
    this.txs.forEach((tx) => {
      tx.transaction.inputs.forEach((input) => {
        const key = this.genKey(input.previousOutput);
        groupByInputOutPoint.set(key, tx);
      });
    });

    return groupByInputOutPoint;
  }

  getCellFilter(): CellFilter {
    return this;
  }
  getTransactionFilter(): TransactionFilter {
    return this;
  }

  private genKey(outPoint: OutPoint) {
    return `${outPoint.txHash}:${outPoint.index}`;
  }
}
