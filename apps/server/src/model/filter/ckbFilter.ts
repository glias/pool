import { QueryOptions } from '@ckb-lumos/base';
import { TransactionWithStatus, OutPoint, scriptEquals, CellOutput, Cell } from '..';

import { BizException } from '../../bizException';

export interface PoolFilter {
  getCellFilter(): CellFilter;
  getTransactionFilter(): TransactionFilter;
}

export interface CellFilter {
  matchCells(queryOptions: QueryOptions, cell: Cell): Cell[];
}

export interface TransactionFilter {
  matchTransactions(queryOptions: QueryOptions): TransactionWithStatus[];
}

export class PendingFilter implements PoolFilter, CellFilter, TransactionFilter {
  private alreadyHash: Set<string> = new Set();
  private readonly poolTxs: TransactionWithStatus[];
  private readonly poolInputTxs?: TransactionWithStatus[];

  constructor(poolTxs: TransactionWithStatus[], poolInputTxs?: TransactionWithStatus[], txs?: TransactionWithStatus[]) {
    txs.forEach((x) => this.alreadyHash.add(x.transaction.hash));
    this.poolTxs = poolTxs;
    this.poolInputTxs = poolInputTxs;
  }

  matchTransactions(queryOptions: QueryOptions): TransactionWithStatus[] {
    if (!this.poolTxs) {
      return [];
    }

    if (!this.poolInputTxs) {
      throw new BizException('inputTxs not undefined');
    }

    const result = this.matchTxsByOutput(queryOptions);
    this.matchTxsByInput(queryOptions).forEach((x) => {
      result.push(x);
    });

    return result;
  }

  matchCells(queryOptions: QueryOptions, cell: Cell): Cell[] {
    const groupByInputOutPoint: Map<string, TransactionWithStatus> = this.getPoolCells();
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
        index: `0x${i.toString(16)}`,
      },
      blockHash: tx.txStatus.blockHash,
      blockNumber: '0',
      data: tx.transaction.outputsData[i],
    };
  }

  matchTxsByInput(queryOptions: QueryOptions): TransactionWithStatus[] {
    const result: TransactionWithStatus[] = [];
    const groupByInputOutPoint = this.getInputCells();
    this.poolTxs.forEach((x) => {
      if (this.alreadyHash.has(x.transaction.hash)) {
        return;
      }

      for (let i = 0; i < x.transaction.inputs.length; i++) {
        const key = this.genKey(x.transaction.inputs[i].previousOutput);
        const cell = groupByInputOutPoint.get(key);
        if (queryOptions.type) {
          if (
            scriptEquals.matchLockScriptWapper(queryOptions.lock, cell.lock) &&
            scriptEquals.matchTypeScriptWapper(queryOptions.type, cell.type)
          ) {
            this.alreadyHash.add(x.transaction.hash);
            result.push(x);
          }
        } else {
          if (scriptEquals.matchLockScriptWapper(queryOptions.lock, cell.lock)) {
            this.alreadyHash.add(x.transaction.hash);
            result.push(x);
          }
        }
      }
    });

    return result;
  }

  matchTxsByOutput(queryOptions: QueryOptions): TransactionWithStatus[] {
    const result: TransactionWithStatus[] = [];
    this.poolTxs.forEach((x) => {
      if (this.alreadyHash.has(x.transaction.hash)) {
        return;
      }
      for (let i = 0; i < x.transaction.outputs.length; i++) {
        const cell = x.transaction.outputs[i];
        if (queryOptions.type) {
          if (
            scriptEquals.matchLockScriptWapper(queryOptions.lock, cell.lock) &&
            scriptEquals.matchTypeScriptWapper(queryOptions.type, cell.type)
          ) {
            this.alreadyHash.add(x.transaction.hash);
            result.push(x);
          }
        } else {
          if (scriptEquals.matchLockScriptWapper(queryOptions.lock, cell.lock)) {
            this.alreadyHash.add(x.transaction.hash);
            result.push(x);
          }
        }
      }
    });

    return result;
  }

  getInputCells(): Map<string, CellOutput> {
    const groupByInputOutPoint: Map<string, CellOutput> = new Map();
    this.poolInputTxs.forEach((x) => {
      for (let i = 0; i < x.transaction.outputs.length; i++) {
        const cell = x.transaction.outputs[i];
        const key = this.genKey({
          txHash: x.transaction.hash,
          index: `0x${i.toString(16)}`,
        });
        groupByInputOutPoint.set(key, cell);
      }
    });

    return groupByInputOutPoint;
  }

  getPoolCells(): Map<string, TransactionWithStatus> {
    const groupByInputOutPoint = new Map<string, TransactionWithStatus>();
    this.poolTxs.forEach((tx) => {
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
