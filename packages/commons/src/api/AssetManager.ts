import { Maybe, CkbAsset, Script, SerializedTransaction, TransactionStatus } from '../';

export interface TransactionSummary {
  // ckb capacity or sudt amount
  amount: string;
  status: TransactionStatus;
  txHash: string;
  // yyyy-MM-dd HH:mm:ss
  date: string;
}

export interface TransactionDetail extends TransactionSummary {
  fee: string;
  blockNumber: number;
}

export type TransactionDirection = 'in' | 'out' | 'all';

type TransactionSummaryDirectionFilter = {
  lock: Script;
  direction: TransactionDirection;
};

export interface TransactionSummaryFilter {
  asset: CkbAsset;
  // filter the transactions from the lock script
  lock: TransactionSummaryDirectionFilter;
}

export interface GenerateSendTransactionOptions {
  asset: CkbAsset;
  fromLock: Script;
  toLock: Script;
  amount: string;
}

export interface AssetManagerAPI {
  /**
   * get TransactionSummary by the filter
   * @param filter
   */
  getTransactionSummaries: (filter: TransactionSummaryFilter) => Promise<TransactionSummary[]>;
  /**
   * get TransactionDetail by the txHash
   * @param txHash
   */
  getTransactionDetail: (txHash: string) => Promise<Maybe<TransactionDetail>>;
  /**
   * generate a sending asset transaction
   * @param options
   */
  generateSendTransaction: (options: GenerateSendTransactionOptions) => Promise<SerializedTransaction>;
}
