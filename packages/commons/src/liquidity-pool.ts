import { AssetWithBalance, TransactionStatus } from '.';

// the liquidity model
export type LiquidityModel = 'UNISWAP';

export interface LiquidityInfo {
  poolId: string;
  model: LiquidityModel;
  // the liquidity provider token corresponding to the liquidity pool
  lpToken: AssetWithBalance;
  // the liquidity assets in the pool
  assets: AssetWithBalance[];
}

export interface LiquidityOrderSummary {
  poolId: string;
  model: LiquidityModel;
  assets: AssetWithBalance[];
  status: TransactionStatus;
}
