import { CkbAsset, Script } from '../assets';
import { SerializedTransaction } from '../transaction';

export type TransactionStatus = 'pending' | 'proposed' | 'committed';

export interface TransactionSummary {
  amount: string;
  status: TransactionStatus;
  date: string;
  txHash: string;
}

export interface TransactionDetail extends TransactionSummary {
  from: string;
  to: string;
  fee: string;
  blockNumber: number;
  status: TransactionStatus;
}

export interface TransactionSummaryFilter {
  asset: CkbAsset;
  lockScript: Script;
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
