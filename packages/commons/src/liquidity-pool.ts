import { AssetWithBalance, TransactionStatus } from '.';

export interface LiquidityInfo {
  poolId: string;
  // the liquidity provider token corresponding to the liquidity pool
  lpToken: AssetWithBalance;
  // the liquidity assets in the pool
  assets: AssetWithBalance[];
}

export interface LiquidityOrderSummary {
  poolId: string;
  assets: AssetWithBalance[];
  status: TransactionStatus;
}
