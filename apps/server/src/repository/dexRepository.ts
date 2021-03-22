import { QueryOptions } from '@ckb-lumos/base';
import { Cell, TransactionWithStatus } from '../model';
import { ForceBridgeRepository } from './forceBridgeRepository';

export type txHash = string;

export type ckbMethods =
  | 'getTipBlockNumber'
  | 'getTipHeader'
  | 'getCurrentEpoch'
  | 'getEpochByNumber'
  | 'getBlockHash'
  | 'getBlock'
  | 'getHeader'
  | 'getHeaderByNumber'
  | 'getLiveCell'
  | 'getTransaction'
  | 'getCellbaseOutputCapacityDetails'
  | 'getBlockEconomicState'
  | 'getTransactionProof'
  | 'verifyTransactionProof'
  | 'getConsensus'
  | 'getBlockByNumber'
  | 'dryRunTransaction'
  | 'calculateDaoMaximumWithdraw'
  | 'indexLockHash'
  | 'getLockHashIndexStates'
  | 'getLiveCellsByLockHash'
  | 'getTransactionsByLockHash'
  | 'getCapacityByLockHash'
  | 'deindexLockHash'
  | 'localNodeInfo'
  | 'getPeers'
  | 'getBannedAddresses'
  | 'clearBannedAddresses'
  | 'setBan'
  | 'syncState'
  | 'setNetworkActive'
  | 'addNode'
  | 'removeNode'
  | 'pingPeers'
  | 'sendTransaction'
  | 'txPoolInfo'
  | 'clearTxPool'
  | 'getRawTxPool'
  | 'getBlockchainInfo'
  | 'rpcProperties';
export interface DexRepository extends ForceBridgeRepository {
  collectCells: (queryOptions: QueryOptions, filterPool?: boolean, includePoolOutput?: boolean) => Promise<Cell[]>;

  collectTransactions: (
    queryOptions: QueryOptions,
    includePool?: boolean,
    includeInputCells?: boolean,
  ) => Promise<TransactionWithStatus[]>;

  getPoolTxs: () => Promise<TransactionWithStatus[]>;

  getTransactions(hashes: string[]): Promise<TransactionWithStatus[]>;

  getTransaction(hash: string): Promise<TransactionWithStatus>;

  getTimestampByBlockNumber(blockNumber: string): Promise<string>;

  getBlockTimestampByHash(blockHash: string): Promise<string>;

  sendTransaction(tx: CKBComponents.RawTransaction): Promise<txHash>;
}
