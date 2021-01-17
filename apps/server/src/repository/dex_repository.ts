import { QueryOptions } from '@ckb-lumos/base';
import { Cell, TransactionWithStatus } from '../model';

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
export interface DexRepository {
  collectCells: (queryOptions: QueryOptions) => Promise<Cell[]>;

  collectTransactions: (queryOptions: QueryOptions) => Promise<TransactionWithStatus[]>;

  getTransactions(ckbReqParams: Array<[method: ckbMethods, ...rest: []]>): Promise<TransactionWithStatus[]>;
}
