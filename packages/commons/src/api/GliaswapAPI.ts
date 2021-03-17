import { Transaction } from '@lay2/pw-core';
import CKB from '@nervosnetwork/ckb-sdk-core';
import {
  Asset,
  CkbAsset,
  CkbAssetWithBalance,
  CkbChainSpec,
  GliaswapAssetWithBalance,
  LiquidityInfo,
  LiquidityOperationSummary,
  LPTokenWithBalance,
  Maybe,
  PoolInfoWithStatus,
  Script,
  SerializedTransactionToSignWithFee,
  SerializedTransactonToSign,
} from '../';
import { EthAsset } from '../assets';
import { SwapOrder } from '../swap';

export interface LiquidityPoolFilter {
  lock?: Script;
  assets?: CkbChainSpec[];
}

export interface LiquidityInfoFilter {
  poolId: string;
  lock?: Script;
}

export interface LiquidityOperationSummaryFilter {
  poolId: string;
  lock: Script;
}

export interface GenerateCreateLiquidityPoolTransactionPayload {
  lock: Script;
  assets: CkbAssetWithBalance[];
}

export interface GenerateCreateLiquidityPoolTransactionResponse {
  transactionToSign: SerializedTransactonToSign;
  fee: string;
  lpToken: CkbAsset;
}

export interface GenerateGenesisLiquidityTransactionPayload {
  poolId: string;
  lock: Script;
  assets: CkbAssetWithBalance[];
  tips: CkbAssetWithBalance;
}

export interface GenerateAddLiquidityTransactionPayload {
  poolId: string;
  lock: Script;
  assetsWithDesiredAmount: CkbAssetWithBalance[];
  assetsWithMinAmount: CkbAssetWithBalance[];
  tips: CkbAssetWithBalance;
}

export interface GenerateRemoveLiquidityTransactionPayload {
  poolId: string;
  lock: Script;
  assetsWithMinAmount: CkbAssetWithBalance[];
  lpToken: LPTokenWithBalance;
  tips: CkbAssetWithBalance;
}

export interface GenerateSwapTransactionPayload {
  assetInWithAmount: CkbAssetWithBalance;
  assetOutWithMinAmount: CkbAssetWithBalance;
  lock: Script;
  tips: CkbAssetWithBalance;
}

export interface GenerateCancelRequestTransactionPayload {
  txHash: string;
  lock: Script;
}

export interface PoolInfoWithStatusFilter {
  assets: CkbChainSpec[];
}

export interface GliaswapAPI {
  /**
   * @deprecated Since external libraries are out of our control,
   * a base interface should have as few direct dependencies on third-party libraries as possible,
   * and therefore may later be refactored to a method in the interface
   */
  ckb: CKB;
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
  getLiquidityPools: (filter?: LiquidityPoolFilter) => Promise<PoolInfoWithStatus[]>;

  /**
   * get liquidity info by poolId, when a lock is passed in,
   * get the {@see LiquidityInfo} associated with the lock
   */
  getLiquidityInfo: (filter: LiquidityInfoFilter) => Promise<Maybe<LiquidityInfo>>;

  getLiquidityOperationSummaries: (filter: LiquidityOperationSummaryFilter) => Promise<LiquidityOperationSummary[]>;

  getSwapOrders: (lock: Script, ethAddress: string) => Promise<SwapOrder[]>;

  cancelSwapOrders: (txHash: string, lock: Script) => Promise<{ tx: Transaction }>;

  getSwapOrderLock: (
    tokenA: GliaswapAssetWithBalance,
    tokenB: GliaswapAssetWithBalance,
    lock: Script,
  ) => Promise<{ lock: Script }>;

  swapNormalOrder: (
    tokenA: GliaswapAssetWithBalance,
    tokenB: GliaswapAssetWithBalance,
    lock: Script,
  ) => Promise<{ tx: Transaction }>;

  generateCreateLiquidityPoolTransaction: (
    payload: GenerateCreateLiquidityPoolTransactionPayload,
  ) => Promise<GenerateCreateLiquidityPoolTransactionResponse>;

  generateGenesisLiquidityTransaction: (
    payload: GenerateGenesisLiquidityTransactionPayload,
  ) => Promise<SerializedTransactionToSignWithFee>;

  generateAddLiquidityTransaction: (
    payload: GenerateAddLiquidityTransactionPayload,
  ) => Promise<SerializedTransactionToSignWithFee>;

  generateRemoveLiquidityTransaction: (
    payload: GenerateRemoveLiquidityTransactionPayload,
  ) => Promise<SerializedTransactionToSignWithFee>;

  generateSwapTransaction: (payload: GenerateSwapTransactionPayload) => Promise<SerializedTransactionToSignWithFee>;

  generateCancelLiquidityRequestTransaction: (
    payload: GenerateCancelRequestTransactionPayload,
  ) => Promise<SerializedTransactionToSignWithFee>;

  // might be refactored to `searchAssets`
  searchSUDT: (typeHash: string) => Promise<CkbAsset | undefined>;

  // might be refactored to `searchAssets`
  searchERC20: (address: string) => Promise<EthAsset | undefined>;

  getPoolInfoWithStatus: (filter: PoolInfoWithStatusFilter) => Promise<Maybe<PoolInfoWithStatus>>;
}
