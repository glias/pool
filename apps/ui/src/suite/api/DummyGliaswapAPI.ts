import {
  Asset,
  GenerateAddLiquidityTransactionPayload,
  GenerateCancelRequestTransactionPayload,
  GenerateCreateLiquidityPoolTransactionPayload,
  GenerateCreateLiquidityPoolTransactionResponse,
  GenerateGenesisLiquidityTransactionPayload,
  GenerateSwapTransactionPayload,
  GliaswapAPI,
  LiquidityInfo,
  LiquidityOrderSummary,
  LiquidityPoolFilter,
  SerializedTransactionToSignWithFee,
  SwapOrder,
} from '@gliaswap/commons';

import { Transaction } from '@lay2/pw-core';
import { TransactionConfig } from 'web3-core';

import { ckbNativeAsset, ckbSudtGlia } from '../placeholder/assets';

import { swapOrders } from 'mock/order-list';
import { assetList } from 'mock/asset-list';
import CKB from '@nervosnetwork/ckb-sdk-core';
import { CKB_NODE_URL } from 'suite/constants';

export class DummyGliaswapAPI implements GliaswapAPI {
  ckb = new CKB(CKB_NODE_URL);
  generateCancelRequestTransaction(
    _payload: GenerateCancelRequestTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
    return Promise.resolve({} as any);
  }

  generateCreateLiquidityPoolTransaction(
    _payload: GenerateCreateLiquidityPoolTransactionPayload,
  ): Promise<GenerateCreateLiquidityPoolTransactionResponse> {
    return Promise.resolve({} as any);
  }

  generateGenesisLiquidityTransaction(
    _payload: GenerateGenesisLiquidityTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
    return Promise.resolve({} as any);
  }

  generateSwapTransaction(_payload: GenerateSwapTransactionPayload): Promise<SerializedTransactionToSignWithFee> {
    return Promise.resolve({} as any);
  }

  async generateAddLiquidityTransaction(
    _payload: GenerateAddLiquidityTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
    return ({} as any) as SerializedTransactionToSignWithFee;
  }

  async generateRemoveLiquidityTransaction(): Promise<SerializedTransactionToSignWithFee> {
    return ({} as any) as SerializedTransactionToSignWithFee;
  }

  async cancelOperation(_txHash: string, _lock: CKBComponents.Script): Promise<SerializedTransactionToSignWithFee> {
    return ({} as any) as SerializedTransactionToSignWithFee;
  }

  getDefaultAssetList() {
    return assetList;
  }

  async getAssetList(): Promise<Asset[]> {
    return assetList;
  }

  async getAssetsWithBalance() {
    return assetList;
  }

  async getLiquidityPools(_filter?: LiquidityPoolFilter): Promise<LiquidityInfo[]> {
    return [
      {
        poolId: '0x1',
        assets: [
          { ...ckbNativeAsset, balance: '9876543210' },
          { ...ckbSudtGlia, balance: '1234567890' },
        ],
        lpToken: { ...ckbSudtGlia, balance: '654312789' },
        model: 'UNISWAP',
      },
    ];
  }

  getLiquidityInfo(): Promise<LiquidityInfo> {
    return Promise.resolve({
      poolId: '0x1',
      assets: [
        { ...ckbNativeAsset, balance: '9876543210' },
        { ...ckbSudtGlia, balance: '1234567890' },
      ],
      lpToken: { ...ckbSudtGlia, balance: '654312789' },
      model: 'UNISWAP',
    });
  }

  getAddLiquidityOrderSummaries(): Promise<LiquidityOrderSummary[]> {
    return Promise.resolve([
      {
        txHash: '0x123456789',
        poolId: '0x1',
        time: '2021-01-01 11:11:11',
        model: 'UNISWAP',
        assets: [
          { ...ckbNativeAsset, balance: '1234567890' },
          { ...ckbSudtGlia, balance: '9876543210' },
        ],
        status: 'pending',
      },
    ]);
  }

  getRemoveLiquidityOrderSummaries(): Promise<LiquidityOrderSummary[]> {
    return Promise.resolve([
      {
        txHash: '0x123456789',
        poolId: '0x1',
        time: '2021-01-01 11:11:11',
        model: 'UNISWAP',
        assets: [
          { ...ckbNativeAsset, balance: '1234567890' },
          { ...ckbSudtGlia, balance: '9876543210' },
        ],
        status: 'pending',
      },
    ]);
  }

  getSwapOrders(): Promise<SwapOrder[]> {
    return Promise.resolve(swapOrders);
  }

  swapCrossChainOrder(): Promise<TransactionConfig> {
    return Promise.resolve(Object.create(null));
  }

  swapCrossIn(): Promise<TransactionConfig> {
    return Promise.resolve(Object.create(null));
  }

  swapCrossOut(): Promise<Transaction> {
    return Promise.resolve(Object.create(null));
  }

  cancelSwapOrders(): Promise<{ tx: Transaction }> {
    return Promise.resolve(Object.create(null));
  }

  swapNormalOrder(): Promise<{ tx: Transaction }> {
    return Promise.resolve(Object.create(null));
  }
}
