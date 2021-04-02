import CKB from '@nervosnetwork/ckb-sdk-core';
import rp from 'request-promise';
import { BizException } from '../bizException';
import { ckbConfig } from '../config';
import { Logger } from '../logger';
import { transactionConver, TransactionWithStatus } from '../model';
import { ckbRepository } from './ckbRepository';
import { DexRepository } from './dexRepository';

export class PoolCache {
  private readonly dexRepository: DexRepository = ckbRepository;
  private readonly ckbNode: CKB = new CKB(ckbConfig.nodeUrl);

  private readonly cache: Map<string, TransactionWithStatus> = new Map<string, TransactionWithStatus>();
  private readonly clean: Map<string, number> = new Map<string, number>();
  constructor() {
    this.schedule();
  }

  private async schedule(): Promise<void> {
    setInterval(async () => {
      this.sync();
    }, 1000);
  }

  private async sync(): Promise<void> {
    const groupByTxHash: Map<string, TransactionWithStatus> = new Map();
    const poolTxs = await this.getPoolTxs();
    poolTxs.forEach((x) => groupByTxHash.set(x.transaction.hash, x));

    for (const hash of this.cache.keys()) {
      const tx = groupByTxHash.get(hash);
      if (!tx) {
        const clean = this.clean.get(hash);
        if (!clean && clean !== 0) {
          this.clean.set(hash, 0);
        } else {
          if (clean > 10) {
            this.cache.delete(hash);
            this.clean.delete(hash);
          } else {
            const markNumber = clean + 1;
            this.clean.set(hash, markNumber);
          }
        }
      }
    }

    for (const hash of groupByTxHash.keys()) {
      const tx = this.cache.get(hash);
      if (!tx) {
        this.cache.set(hash, groupByTxHash.get(hash));
      }
    }
  }

  getTxs(): TransactionWithStatus[] {
    const result = [];
    for (const value of this.cache.values()) {
      result.push(value);
    }

    return result;
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
      const hashes: string[] = [];
      for (const hash of Object.keys(result.result.pending)) {
        hashes.push(hash);
      }

      for (const hash of Object.keys(result.result.proposed)) {
        hashes.push(hash);
      }

      if (hashes.length === 0) {
        return [];
      }

      return await this.getTransactions(hashes);
    } catch (error) {
      console.error(error);
      throw new BizException('query tx pool error!');
    }
  }

  async getTransactions(hashes: string[]): Promise<TransactionWithStatus[]> {
    if (hashes.length === 0) {
      return [];
    }

    const ckbReqParams = [];
    hashes.forEach((x) => ckbReqParams.push(['getTransaction', x]));

    try {
      const ckbTxs = await this.ckbNode.rpc.createBatchRequest(ckbReqParams).exec();
      return await Promise.all(
        ckbTxs.map(async (x) => {
          const tx = transactionConver.conver(x);
          if (x.txStatus.blockHash) {
            const timestamp = await this.getBlockTimestampByHash(tx.txStatus.blockHash);
            tx.txStatus.timestamp = timestamp;
          } else {
            tx.txStatus.timestamp = `0x${new Date().getTime().toString(16)}`;
          }
          return tx;
        }),
      );
    } catch (error) {
      Logger.error(error);
    }
  }

  async getBlockTimestampByHash(blockHash: string): Promise<string> {
    if (!blockHash) {
      return `0x${new Date().getTime().toString(16)}`;
    }
  }
}

export const poolCache = new PoolCache();
