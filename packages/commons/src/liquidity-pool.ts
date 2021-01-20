import { Asset, AssetWithBalance, TransactionStatus } from '.';

export type LiquidityAssetWithBalance = AssetWithBalance;
export type LPTokenWithBalance = AssetWithBalance;

// the pool model
export type PoolModel = 'UNISWAP';

export interface PoolInfo {
  poolId: string;
  assets: Asset[];
  model: PoolModel;
}

export interface LiquidityInfo extends PoolInfo {
  // the liquidity provider token corresponding to the liquidity pool
  lpToken: LPTokenWithBalance;
  // the liquidity assets in the pool
  assets: LiquidityAssetWithBalance[];
}

export interface LiquidityOrderSummary extends PoolInfo {
  txHash: string;
  // yyyy-MM-dd HH:mm:ss
  time: string;
  status: TransactionStatus;
  assets: LiquidityAssetWithBalance[];
}

export interface PoolShareInfo {
  changedShare: number;
  // fee for aggregator
  requestFee: LiquidityAssetWithBalance;
}

export function calcAddPoolShareInfo(poolLiquidity: LiquidityInfo, added: LiquidityAssetWithBalance[]): PoolShareInfo {
  if (poolLiquidity.model === 'UNISWAP') {
    // TODO implement the liquidity fee
    const [addedA, addedB] = added;
    const [poolA, poolB] = poolLiquidity.assets;
    console.log(addedA, addedB, poolA, poolB);

    // return {};
  }

  const lpToken = poolLiquidity.lpToken;
  return {
    requestFee: { ...lpToken, balance: '0' },
    changedShare: 0,
  };
}
