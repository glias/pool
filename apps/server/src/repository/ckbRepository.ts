import { QueryOptions } from '@ckb-lumos/base';
import CKB from '@nervosnetwork/ckb-sdk-core';
import rp from 'request-promise';
import { DexRepository } from '.';
import { ckbConfig } from '../config';
import { Cell, cellConver, OutPoint, scriptEquals, transactionConver, TransactionWithStatus } from '../model';
import { ckbMethods } from './dexRepository';
import { lumosRepository, SqlIndexerWrapper } from './lumosRepository';

export class CkbRepository implements DexRepository {
  private readonly lumosRepository: SqlIndexerWrapper;
  private readonly ckbNode: CKB;

  constructor() {
    this.lumosRepository = lumosRepository;
    this.ckbNode = new CKB(ckbConfig.nodeUrl);
  }

  async collectCells(queryOptions: QueryOptions): Promise<Cell[]> {
    const lumosCells = await this.lumosRepository.collectCells(queryOptions);
    const dexCells = lumosCells.map((x) => cellConver.conver(x));
    const groupByInputOutPoint = await this.getPoolCells();
    const result: Cell[] = [];

    dexCells.forEach((cell) => {
      const tx = groupByInputOutPoint.get(this.genKey(cell.outPoint));
      if (tx) {
        for (let i = 0; i < tx.transaction.outputs.length; i++) {
          const output = tx.transaction.outputs[i];
          if (output.type) {
            if (
              scriptEquals.equalsLockScript(queryOptions.lock, output.lock) &&
              scriptEquals.equalsTypeScript(queryOptions.type, output.type)
            ) {
              const pendingCell: Cell = {
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

              result.push(pendingCell);
            }
          }
        }
      } else {
        result.push(cell);
      }
    });
    return result;
  }

  async collectTransactions(queryOptions: QueryOptions): Promise<TransactionWithStatus[]> {
    const lumosTxs = await this.lumosRepository.collectTransactions(queryOptions);
    return lumosTxs.map((x) => transactionConver.conver(x));
  }

  async getTransactions(ckbReqParams: Array<[method: ckbMethods, ...rest: []]>): Promise<TransactionWithStatus[]> {
    try {
      const ckbTxs = await this.ckbNode.rpc.createBatchRequest(ckbReqParams).exec();
      return ckbTxs.map((x) => transactionConver.conver(x));
    } catch (error) {
      console.log(error);
    }
  }

  async getTransaction(hash: string): Promise<TransactionWithStatus> {
    const tx = await this.ckbNode.rpc.getTransaction(hash);
    return transactionConver.conver(tx);
  }

  private async getPoolTxs(): Promise<TransactionWithStatus[]> {
    try {
      const QueryOptions = {
        url: ckbConfig.nodeUrl,
        method: 'POST',
        json: true,
        headers: {
          'content-type': 'application/json',
        },
        body: {
          id: 42,
          jsonrpc: '2.0',
          method: 'get_raw_tx_pool',
          params: [true],
        },
      };
      const result = await rp(QueryOptions);
      const hashes = [];
      for (const hash of Object.keys(result.result.pending)) {
        hashes.push(['getTransaction', hash]);
      }

      for (const hash of Object.keys(result.result.proposed)) {
        hashes.push(['getTransaction', hash]);
      }

      if (hashes.length === 0) {
        return [];
      }

      return await this.getTransactions(hashes);
    } catch (error) {
      console.error(error);
      throw new Error('query tx pool error!');
    }
  }

  async getPoolCells(): Promise<Map<string, TransactionWithStatus>> {
    const groupByInputOutPoint = new Map<string, TransactionWithStatus>();
    (await this.getPoolTxs()).forEach((tx) => {
      tx.transaction.inputs.forEach((input) => {
        const key = this.genKey(input.previousOutput);
        groupByInputOutPoint.set(key, tx);
      });
    });

    return groupByInputOutPoint;
  }

  private genKey(outPoint: OutPoint) {
    return `${outPoint.txHash}:${outPoint.index}`;
  }
}

export const ckbRepository = new CkbRepository();
