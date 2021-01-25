import { QueryOptions } from '@ckb-lumos/base';
import CKB from '@nervosnetwork/ckb-sdk-core';
import rp from 'request-promise';
import { DexRepository, txHash } from '.';
import { ckbConfig, forceBridgeServerUrl, SWAP_ORDER_LOCK_CODE_HASH, SWAP_ORDER_LOCK_HASH_TYPE } from '../config';
import {
  BridgeInfo,
  Cell,
  cellConver,
  OutPoint,
  Script,
  scriptEquals,
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
    return await Promise.all(
      lumosTxs.map(async (x) => {
        const tx = transactionConver.conver(x);
        const timestamp = await this.getBlockTimestampByHash(tx.txStatus.blockHash);
        tx.txStatus.timestamp = timestamp;
        return tx;
      }),
    );
  }

  async getTransactions(ckbReqParams: Array<[method: ckbMethods, ...rest: []]>): Promise<TransactionWithStatus[]> {
    try {
      const ckbTxs = await this.ckbNode.rpc.createBatchRequest(ckbReqParams).exec();
      return await Promise.all(
        ckbTxs.map(async (x) => {
          const tx = transactionConver.conver(x);
          if (x.txStatus.blockHash) {
            const timestamp = await this.getBlockTimestampByHash(tx.txStatus.blockHash);
            tx.txStatus.timestamp = timestamp;
          } else {
            tx.txStatus.timestamp = new Date().getTime().toString(16);
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
      tx.txStatus.timestamp = new Date().getTime().toString(16);
    }

    return tx;
  }

  async getBlockTimestampByHash(blockHash: string): Promise<string> {
    const req = [];
    req.push(['getBlock', blockHash]);
    const block = await this.ckbNode.rpc.createBatchRequest(req).exec();
    return block[0].header.timestamp;
  }

  /**
   *
   * @param lock  user lock
   * @param pureCross  If pureCross = true, then it is a cross chain order, otherwise it is an cross chain order + place order
   */
  async getForceBridgeHistory(
    lock: Script,
    ethAddress: string,
    pureCross: boolean,
  ): Promise<{
    eth_to_ckb: BridgeInfo[];
    ckb_to_eth: BridgeInfo[];
  }> {
    try {
      const userLock = lock.toPwScript();
      const orderLock = new Script(
        SWAP_ORDER_LOCK_CODE_HASH,
        SWAP_ORDER_LOCK_HASH_TYPE,
        userLock.toHash(),
      ).toPwScript();

      const QueryOptions = {
        url: `${forceBridgeServerUrl}/get_crosschain_history`,
        method: 'POST',
        body: {
          ckb_recipient_lockscript_addr: pureCross
            ? userLock.toAddress().toCKBAddress()
            : orderLock.toAddress().toCKBAddress(),
          eth_recipient_addr: ethAddress,
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
