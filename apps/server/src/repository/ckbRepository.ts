import { QueryOptions } from '@ckb-lumos/base';
import CKB from '@nervosnetwork/ckb-sdk-core';
import rp from 'request-promise';
import { DexRepository, txHash } from '.';
import { ckbConfig, forceBridgeServerUrl } from '../config';
import {
  BridgeInfo,
  Cell,
  cellConver,
  OutPoint,
  PendingFilter,
  PoolFilter,
  Script,
  transactionConver,
  TransactionWithStatus,
} from '../model';
import { ckbMethods } from './dexRepository';
import { lumosRepository, SqlIndexerWrapper } from './lumosRepository';

export class CkbRepository implements DexRepository {
  private readonly lumosRepository: SqlIndexerWrapper;
  private readonly ckbNode: CKB;

  constructor() {
    this.lumosRepository = lumosRepository;
    this.ckbNode = new CKB(ckbConfig.nodeUrl);
  }
  async sendTransaction(tx: CKBComponents.RawTransaction): Promise<txHash> {
    const timeout = (ms: number) => {
      return new Promise((resolve, _reject) => {
        setTimeout(function () {
          resolve(null);
        }, ms);
      });
    };

    const txHash = await this.ckbNode.rpc.sendTransaction(tx);

    let count = 5;
    while (count >= 0) {
      const txsInPool = await this.getPoolTxs();
      for (let i = 0; i < txsInPool.length; i++) {
        const status = txsInPool[i].txStatus.status;
        if (status == 'pending' || status == 'proposed') {
          return txHash;
        }
      }
      count -= 1;
      await timeout(5000);
    }

    throw new Error('send transaction timeout');
  }

  async collectCells(queryOptions: QueryOptions, includePoolOutput?: boolean): Promise<Cell[]> {
    const lumosCells = await this.lumosRepository.collectCells(queryOptions);
    const dexCells = lumosCells.map((x) => cellConver.conver(x));
    const result: Cell[] = [];

    const pendingTxs = await this.getPoolTxs();
    const filter: PoolFilter = new PendingFilter(pendingTxs, null);
    for (const cell of dexCells) {
      const matchCells = filter.getCellFilter().matchCells(queryOptions, cell);
      if (matchCells.length !== 0 && includePoolOutput) {
        matchCells.forEach((x) => result.push(x));
      } else {
        result.push(cell);
      }
    }

    return result;
  }

  async collectTransactions(queryOptions: QueryOptions, includePool?: boolean): Promise<TransactionWithStatus[]> {
    const lumosTxs = await this.lumosRepository.collectTransactions(queryOptions);
    const result = await Promise.all(
      lumosTxs.map(async (x) => {
        const tx = transactionConver.conver(x);
        const timestamp = await this.getBlockTimestampByHash(tx.txStatus.blockHash);
        tx.txStatus.timestamp = timestamp;
        return tx;
      }),
    );

    if (includePool) {
      const pendingTxs = await this.getPoolTxs();
      const hashes = [];
      for (const tx of pendingTxs) {
        tx.transaction.inputs.forEach((x) => {
          hashes.push(['getTransaction', x.previousOutput.txHash]);
        });
      }
      const inputTxs = await this.getTransactions(hashes);
      const filter: PoolFilter = new PendingFilter(pendingTxs, inputTxs);
      filter
        .getTransactionFilter()
        .matchTransactions(queryOptions)
        .forEach((x) => result.push(x));
    }

    return result;
  }

  async getTransactions(ckbReqParams: Array<[method: ckbMethods, ...rest: []]>): Promise<TransactionWithStatus[]> {
    if (ckbReqParams.length === 0) {
      return [];
    }

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
      console.log(error);
    }
  }

  async getTransaction(hash: string): Promise<TransactionWithStatus> {
    const ckbTx = await this.ckbNode.rpc.getTransaction(hash);
    const tx = transactionConver.conver(ckbTx);
    if (tx.txStatus.blockHash) {
      const timestamp = await this.getBlockTimestampByHash(tx.txStatus.blockHash);
      tx.txStatus.timestamp = timestamp;
    } else {
      tx.txStatus.timestamp = `0x${new Date().getTime().toString(16)}`;
    }

    return tx;
  }

  async getBlockTimestampByHash(blockHash: string): Promise<string> {
    const req = [];
    req.push(['getBlock', blockHash]);
    const block = await this.ckbNode.rpc.createBatchRequest(req).exec();
    return block[0].header.timestamp;
  }

  async getForceBridgeHistory(
    lock: Script,
    ethAddress: string,
  ): Promise<{
    eth_to_ckb: BridgeInfo[];
    ckb_to_eth: BridgeInfo[];
  }> {
    try {
      const userLock = lock.toPwScript();
      const QueryOptions = {
        url: `${forceBridgeServerUrl}/get_crosschain_history`,
        method: 'POST',
        body: {
          lock_sender_addr: userLock.args.slice(2, 42),
          eth_recipient_addr: ethAddress.slice(2, 42),
        },
        json: true,
      };
      const result = await rp(QueryOptions);
      return result;
    } catch (error) {
      console.error(error);
      throw new Error('query bridge server error');
    }
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
