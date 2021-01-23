import { Transaction } from '@lay2/pw-core';
import { TransactionConfig } from 'web3-core';
import { Asset, GliaswapAssetWithBalance, LiquidityInfo, LiquidityOrderSummary, Maybe, Script } from '../';
import { SwapOrder } from '../swap';

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
  getLiquidityPools: (filter?: LiquidityPoolFilter) => Promise<LiquidityInfo[]>;

  /**
   * get liquidity info by poolId, when a lock is passed in,
   * get the {@see LiquidityInfo} associated with the lock
   */
  getLiquidityInfo: (filter: LiquidityInfoFilter) => Promise<Maybe<LiquidityInfo>>;

  getAddLiquidityOrderSummaries: (filter: LiquidityOrderSummaryFilter) => Promise<LiquidityOrderSummary[]>;

  getRemoveLiquidityOrderSummaries: (filter: LiquidityOrderSummaryFilter) => Promise<LiquidityOrderSummary[]>;

  getSwapOrders: (lock: Script) => Promise<SwapOrder[]>;

  cancelSwapOrders: (txHash: string, lock: Script) => Promise<Transaction>;

  swapNormalOrder: (tokenA: GliaswapAssetWithBalance, tokenB: GliaswapAssetWithBalance) => Promise<Transaction>;

  swapCrossChainOrder: (
    tokenA: GliaswapAssetWithBalance,
    tokenB: GliaswapAssetWithBalance,
  ) => Promise<TransactionConfig>;

  /**
   * eg. ETH -> ckETH
   */
  swapCrossIn: (tokenA: GliaswapAssetWithBalance, tokenB: GliaswapAssetWithBalance) => Promise<TransactionConfig>;

  /**
   * eg. ckETH -> ETH
   */
  swapCrossOut: (tokenA: GliaswapAssetWithBalance, tokenB: GliaswapAssetWithBalance) => Promise<Transaction>;

  // TODO generate transaction and the other data API
}
