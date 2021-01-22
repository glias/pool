import { CkbAsset, Maybe, Script, SerializedTransactionWithFee, TransactionStatus } from '../';

export interface TransferSummary {
  // ckb capacity or sudt amount
  amount: string;
  status: TransactionStatus;
  txHash: string;
  // yyyy-MM-dd HH:mm:ss
  date: string;
}

export interface TransferDetail extends TransferSummary {
  fee: string;
  blockNumber: number;
}

export type TransferDirection = 'in' | 'out' | 'all';

export interface TransferSummaryFilter {
  asset: CkbAsset;
  // filter the transactions from the lock script
  lock: Script;
  direction: TransferDirection;
}

export interface GenerateTransferTransactionOptions {
  asset: CkbAsset;
  fromLock: Script;
  toLock: Script;
  amount: string;
}

interface GetTransferDetailOptions {
  asset: CkbAsset;
  lock: Script;
  txHash: string;
}

export interface AssetManagerAPI {
  /**
   * get TransactionSummary by the filter
   * @param filter
   */
  getTransactionSummaries: (filter: TransferSummaryFilter) => Promise<TransferSummary[]>;
  /**
   * get TransactionDetail by the txHash
   * @param txHash
   */
  getTransactionDetail: (options: GetTransferDetailOptions) => Promise<Maybe<TransferDetail>>;
  /**
   * generate a sending asset transaction
   * @param options
   */
  generateTransferTransaction: (options: GenerateTransferTransactionOptions) => Promise<SerializedTransactionWithFee>;
}
