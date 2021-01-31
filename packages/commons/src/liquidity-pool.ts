import { CkbAssetWithBalance } from '.';

export type OperationRequestStatus =
  // the request transaction is pending in the transaction pool
  | 'pending'
  // the request transaction is committed and waiting for aggregating
  | 'open'
  // the cancel request transaction is pending in transaction pool
  | 'canceling';

export type LiquidityOperationType =
  // add liquidity
  | 'add'
  // remove liquidity
  | 'remove';

export type LiquidityAssetWithBalance = CkbAssetWithBalance;
export type LPTokenWithBalance = CkbAssetWithBalance;

// the pool model
export type PoolModel = 'UNISWAP';

export interface PoolInfo {
  poolId: string;
  assets: LiquidityAssetWithBalance[];
  model: PoolModel;
}

export interface LiquidityInfo extends PoolInfo {
  // the liquidity provider token corresponding to the liquidity pool
  lpToken: LPTokenWithBalance;
}

export interface LiquidityRequestSummary extends PoolInfo {
  txHash: string;
  // yyyy-MM-dd HH:mm:ss
  time: string;
  status: OperationRequestStatus;
  assets: LiquidityAssetWithBalance[];
  lpToken: LPTokenWithBalance;
  type: LiquidityOperationType;
}

export interface PoolShareInfo {
  changedShare: number;
  // fee for aggregator
  requestFee: LiquidityAssetWithBalance;
}
