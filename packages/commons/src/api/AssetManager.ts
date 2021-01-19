import { CkbAsset, Script } from '../assets';
import { SerializedTransaction } from '../transaction';

export type TransactionStatus = 'pending' | 'proposed' | 'committed';

export interface TransactionSummary {
  // ckb capacity or sudt amount
  amount: string;
  status: TransactionStatus;
  txHash: string;
  fromLock: Script;
  toLock: Script;
  // yyyy-MM-dd HH:mm:ss
  date: string;
}

export interface TransactionDetail extends TransactionSummary {
  fee: string;
  blockNumber: number;
}

type TransactionSummaryDirectionFilter = { fromLock: Script } | { toLock: Script } | Script;

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
  getTransactionDetail: (txHash: string) => Promise<TransactionDetail>;
  /**
   * generate a sending asset transaction
   * @param options
   */
  generateSendTransaction: (options: GenerateSendTransactionOptions) => Promise<SerializedTransaction>;
}
