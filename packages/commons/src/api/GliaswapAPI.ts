import { Asset, GliaswapAssetWithBalance, LiquidityInfo, LiquidityOrderSummary, Script } from '@gliaswap/commons';

interface LiquidityInfoFilter {
  poolId: string;
  lock?: Script;
}

interface LiquidityOrderSummaryFilter {
  poolId: string;
  lock: Script;
}

export interface GliaswapAPI {
  /**
   * get the default asset list, used as a placeholder
   */
  getDefaultAssetList: () => Asset[];
  /**
   * get a registered asset list, if no `name` is passed, the built-in asset list is returned
   */
  getAssetList: (name?: string) => Promise<Asset[]>;
  /**
   * Get assets with balances, if no `assets` is passed, the built-in AssetWithBalance is returned
   */
  getAssetsWithBalance: (lock: Script, assets?: Asset[]) => Promise<GliaswapAssetWithBalance[]>;
  /**
   * get liquidity pools information
   */
  getLiquidityPools: () => Promise<LiquidityInfo[]>;

  /**
   * get liquidity info by poolId, when a lock is passed in,
   * get the {@see LiquidityInfo} associated with the lock
   */
  getLiquidityInfo: (filter: LiquidityInfoFilter) => Promise<LiquidityInfo>;

  getAddLiquidityOrderSummaries: (filter: LiquidityOrderSummaryFilter) => Promise<LiquidityOrderSummary[]>;

  getRemoveLiquidityOrderSummaries: (filter: LiquidityOrderSummaryFilter) => Promise<LiquidityOrderSummary[]>;

  // TODO generate transaction and the other data API
}
