import { QueryOptions } from '@ckb-lumos/base';
import CKB from '@nervosnetwork/ckb-sdk-core';
import rp from 'request-promise';
import { DexRepository, txHash } from '.';
import { ckbConfig, FORCE_BRIDGE_SERVER_URL } from '../config';
import {
  BridgeInfo,
  Cell,
  cellConver,
  CellOutput,
  OutPoint,
  PendingFilter,
  PoolFilter,
  Script,
  transactionConver,
  TransactionWithStatus,
} from '../model';
import { lumosRepository, SqlIndexerWrapper } from './lumosRepository';
import { BizException } from '../bizException';
import { StopWatch } from '../model/time/stopWatch';
import { Logger } from '../logger';
import { dexCache, DexCache } from '../cache';

export class CkbRepository implements DexRepository {
  private readonly lumosRepository: SqlIndexerWrapper;
  private readonly ckbNode: CKB;
  private readonly dexCache: DexCache = dexCache;

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

    throw new BizException('send transaction timeout');
  }

  async collectCells(queryOptions: QueryOptions, filterPool = true, includePoolOutput?: boolean): Promise<Cell[]> {
    const lumosCells = await this.lumosRepository.collectCells(queryOptions);
    const dexCells = lumosCells.map((x) => cellConver.conver(x));
    const result: Cell[] = [];

    if (filterPool) {
      const pendingTxs = await this.getPoolTxs();
      const filter: PoolFilter = new PendingFilter(pendingTxs, null, []);
      for (const cell of dexCells) {
        const matchCells = filter.getCellFilter().matchCells(queryOptions, cell);
        if (matchCells.length !== 0) {
          if (includePoolOutput) {
            matchCells.forEach((x) => result.push(x));
          }
        } else {
          result.push(cell);
        }
      }
    } else {
      dexCells.forEach((x) => result.push(x));
    }

    return result;
  }

  async collectTransactions(
    queryOptions: QueryOptions,
    includePool?: boolean,
    includeInputCells?: boolean,
  ): Promise<TransactionWithStatus[]> {
    const sw = new StopWatch();
    sw.start();
    const lumosTxs = await this.lumosRepository.collectTransactions(queryOptions);
    Logger.info('query txs:', sw.split());
    const result = await Promise.all(
      lumosTxs.map(async (x) => {
        const tx = transactionConver.conver(x);
        const timestamp = await this.getBlockTimestampByHash(tx.txStatus.blockHash);
        tx.txStatus.timestamp = timestamp;
        return tx;
      }),
    );

    Logger.info('query txs timestamp:', sw.split());

    if (includePool) {
      const pendingTxs = await this.getPoolTxs();
      const hashes: string[] = [];
      for (const tx of pendingTxs) {
        tx.transaction.inputs.forEach((x) => {
          hashes.push(x.previousOutput.txHash);
        });
      }
      const inputTxs = await this.getTransactions(hashes);
      const filter: PoolFilter = new PendingFilter(pendingTxs, inputTxs, result);
      filter
        .getTransactionFilter()
        .matchTransactions(queryOptions)
        .forEach((x) => result.push(x));
    }

    Logger.info('includePool:', sw.split());
    if (includeInputCells) {
      const hashes: Set<string> = new Set();
      result.forEach((x) => {
        x.transaction.inputs.forEach((y) => {
          hashes.add(y.previousOutput.txHash);
        });
      });

      const inputCellsGroup: Map<string, CellOutput> = new Map();

      const inputTxs = await this.getTransactions(Array.from(hashes));
      Logger.info('get tx input cell: ', sw.split());
      inputTxs.forEach((x) => {
        x.transaction.outputs.forEach((value, index) => {
          const cell = {
            capacity: value.capacity,
            lock: cellConver.converScript(value.lock),
            type: cellConver.converScript(value.type),
          };
          inputCellsGroup.set(`${x.transaction.hash}:${index}`, cell);
        });
      });

      result.forEach((x) => {
        x.transaction.inputs.forEach((y) => {
          y.cellOutput = inputCellsGroup.get(`${y.previousOutput.txHash}:${parseInt(y.previousOutput.index)}`);
        });
      });
    }

    Logger.info('includeInputCells:', sw.split());
    return result;
  }

  async getTransactions(hashes: string[]): Promise<TransactionWithStatus[]> {
    if (hashes.length === 0) {
      return [];
    }

    // const result = [];
    // for (const hash of hashes) {
    //   const txJson = await this.dexCache.get(hash);
    //   if (!txJson) {
    //     const tx = await this.getTransaction(hash);
    //     this.dexCache.set(hash, JSON.stringify(tx));
    //     result.push(tx);
    //   } else {
    //     result.push(JSON.parse(txJson));
    //   }
    // }
    //
    // for (const x of result) {
    //   const tx = transactionConver.conver(x);
    //   if (tx.txStatus.blockHash) {
    //     const timestamp = await this.getBlockTimestampByHash(tx.txStatus.blockHash);
    //     tx.txStatus.timestamp = timestamp;
    //   } else {
    //     tx.txStatus.timestamp = `0x${new Date().getTime().toString(16)}`;
    //   }
    // }
    //
    // return result;

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

  async getTransaction(hash: string): Promise<TransactionWithStatus> {
    const txJson = await this.dexCache.get(hash);
    let ckbTx;
    if (!txJson) {
      ckbTx = await this.ckbNode.rpc.getTransaction(hash);
      this.dexCache.set(hash, JSON.stringify(ckbTx));
    } else {
      ckbTx = JSON.parse(txJson);
    }

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
    const timestamp = await this.dexCache.get(`timestamp:${blockHash}`);
    if (!timestamp) {
      const req = [];
      req.push(['getBlock', blockHash]);
      const block = await this.ckbNode.rpc.createBatchRequest(req).exec();
      this.dexCache.set(`timestamp:${blockHash}`, block[0].header.timestamp);
      return block[0].header.timestamp;
    } else {
      return timestamp;
    }
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
        url: `${FORCE_BRIDGE_SERVER_URL}/get_crosschain_history`,
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
      throw new BizException('query bridge server error');
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
