import { QueryOptions } from '@ckb-lumos/base';
import { TransactionWithStatus, OutPoint, scriptEquals, CellOutput } from '..';
import { Cell } from '..';

export interface PoolFilter {
  getCellFilter(): CellFilter;
  getTransactionFilter(): TransactionFilter;
}

export interface CellFilter {
  matchCells(queryOptions: QueryOptions, cell: Cell): Promise<Cell[]>;
}

export interface TransactionFilter {
  matchTransactions(): void;
}

export class PendingFilter implements PoolFilter, CellFilter, TransactionFilter {
  constructor(private txs: TransactionWithStatus[]) {}
  matchTransactions(): void {
    throw new Error('Method not implemented.');
  }

  async matchCells(queryOptions: QueryOptions, cell: Cell): Promise<Cell[]> {
    const groupByInputOutPoint: Map<string, TransactionWithStatus> = await this.getPoolCells();
    const tx = groupByInputOutPoint.get(this.genKey(cell.outPoint));
    const result: Cell[] = [];
    if (tx) {
      for (let i = 0; i < tx.transaction.outputs.length; i++) {
        const output = tx.transaction.outputs[i];
        if (queryOptions.type) {
          if (
            scriptEquals.matchLockScriptWapper(queryOptions.lock, output.lock) &&
            scriptEquals.matchTypeScriptWapper(queryOptions.type, output.type)
          ) {
            const pendingCell: Cell = this.buildPendingCell(output, tx, i);
            result.push(pendingCell);
          }
        } else {
          // console.log(scriptEquals.matchLockScriptWapper(queryOptions.lock, output.lock));

          if (scriptEquals.matchLockScriptWapper(queryOptions.lock, output.lock)) {
            const pendingCell: Cell = this.buildPendingCell(output, tx, i);
            result.push(pendingCell);
          }
        }
      }
    }
    return result;
  }

  private buildPendingCell(cellOutput: CellOutput, tx: TransactionWithStatus, i: number): Cell {
    return {
      cellOutput: {
        capacity: cellOutput.capacity,
        lock: cellOutput.lock,
        type: cellOutput.type,
      },
      outPoint: {
        txHash: tx.transaction.hash,
        index: i.toString(16),
      },
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
