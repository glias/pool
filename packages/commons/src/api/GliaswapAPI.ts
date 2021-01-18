import { Asset, GliaswapAssetWithBalance, LiquidityPool, Script } from '@gliaswap/commons';

export interface GliaswapAPI {
  /**
   * get the default asset list
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

  getLiquidityPools: (lock?: Script) => Promise<LiquidityPool[]>;

  // TODO generate transaction and the other data API
}
