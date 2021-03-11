import { CkbAssetWithBalance } from '.';

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

export interface PoolInfoWithStatus extends PoolInfo {
  status:
    | 'pending' // the request transaction is pending in the transaction pool
    | 'completed'; // the create pool request transaction is completed
}

export type LiquidityOperationStage = Submitted | Confirmed | Canceling | Completed | Canceled;

// the request transaction is pending in the transaction pool
type Submitted = { status: 'pending'; steps: [{ txHash: string }] };
// the request transaction is committed and waiting for aggregating
type Confirmed = { status: 'open'; steps: [{ txHash: string }, { txHash: string }] };
// the cancel request transaction is pending in transaction pool
type Canceling = { status: 'canceling'; steps: [{ txHash: string }, { txHash: string }, { txHash: string }] };
// the completed request transaction is matched
type Completed = { status: 'completed'; steps: [{ txHash: string }, { txHash: string }, { txHash: string }] };
// the completed request transaction is matched
type Canceled = { status: 'canceled'; steps: [{ txHash: string }, { txHash: string }, { txHash: string }] };

export interface LiquidityOperationSummary extends PoolInfo {
  txHash: string;
  // yyyy-MM-dd HH:mm:ss
  time: string;
  assets: LiquidityAssetWithBalance[];
  lpToken: LPTokenWithBalance;
  type: LiquidityOperationType;
  stage: LiquidityOperationStage;
}

export interface PoolShareInfo {
  changedShare: number;
  // fee for aggregator
  requestFee: LiquidityAssetWithBalance;
}
