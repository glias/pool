import { Transaction } from '@lay2/pw-core';
import { SwapOrder } from '../swap';
import CKB from '@nervosnetwork/ckb-sdk-core';
import Web3 from 'web3';
import {
  Asset,
  CkbAsset,
  CkbAssetWithBalance,
  GliaswapAssetWithBalance,
  LiquidityInfo,
  LiquidityOrderSummary,
  LPTokenWithBalance,
  Maybe,
  PoolInfo,
  Script,
  SerializedTransactionToSignWithFee,
  SerializedTransactonToSign,
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

export interface GliaswapAPI {
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
  getAssetsWithBalance: (
    lock: Script,
    assets?: Asset[],
    ethAddr?: string,
    web3?: Web3,
  ) => Promise<GliaswapAssetWithBalance[]>;
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

  getSwapOrders: (lock: Script, ethAddress: string) => Promise<SwapOrder[]>;

  cancelSwapOrders: (txHash: string, lock: Script) => Promise<{ tx: Transaction }>;

  swapNormalOrder: (
    tokenA: GliaswapAssetWithBalance,
    tokenB: GliaswapAssetWithBalance,
    lock: Script,
  ) => Promise<{ tx: Transaction }>;

  // TODO generate transaction and the other data API
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

  generateCancelRequestTransaction: (
    payload: GenerateCancelRequestTransactionPayload,
  ) => Promise<SerializedTransactionToSignWithFee>;

  cancelOperation: (txHash: string, lock: Script) => Promise<SerializedTransactionToSignWithFee>;
}
