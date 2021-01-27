import {
  Asset,
  ChainSpec,
  CkbAssetWithBalance,
  GliaswapAssetWithBalance,
  LiquidityInfo,
  LiquidityOrderSummary,
  Maybe,
  PoolInfo,
  Script,
  SerializedTransactionToSignWithFee,
} from '../';

export interface LiquidityPoolFilter {
  lock?: Script;
}

export interface LiquidityInfoFilter {
  poolId: string;
  lock?: Script;
}

export interface LiquidityOrderSummaryFilter {
  poolId: string;
  lock: Script;
}

export interface GenerateAddLiquidityTransactionPayload {
  poolId: string;
  lock: Script;
  assetsWithDesiredAmount: CkbAssetWithBalance[];
  assetsWithMinAmount: CkbAssetWithBalance[];
}

export interface GenerateRemoveLiquidityTransactionPayload {
  poolId: string;
  lock: Script;
  assetsWithDesiredAmount: CkbAssetWithBalance[];
  assetsWithMinAmount: CkbAssetWithBalance[];
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
  getAssetsWithBalance: (lock: Script, assets?: ChainSpec[]) => Promise<GliaswapAssetWithBalance[]>;
  /**
   * get liquidity pools information
   */
  getLiquidityPools: (filter?: LiquidityPoolFilter) => Promise<PoolInfo[]>;

  /**
   * get liquidity info by poolId, when a lock is passed in,
   * get the {@see LiquidityInfo} associated with the lock
   */
  getLiquidityInfo: (filter: LiquidityInfoFilter) => Promise<Maybe<LiquidityInfo>>;

  getAddLiquidityOrderSummaries: (filter: LiquidityOrderSummaryFilter) => Promise<LiquidityOrderSummary[]>;

  getRemoveLiquidityOrderSummaries: (filter: LiquidityOrderSummaryFilter) => Promise<LiquidityOrderSummary[]>;

  generateAddLiquidityTransaction: (
    payload: GenerateAddLiquidityTransactionPayload,
  ) => Promise<SerializedTransactionToSignWithFee>;

  generateRemoveLiquidityTransaction: (
    payload: GenerateRemoveLiquidityTransactionPayload,
  ) => Promise<SerializedTransactionToSignWithFee>;

  cancelOperation: (txHash: string, lock: Script) => Promise<SerializedTransactionToSignWithFee>;
}
