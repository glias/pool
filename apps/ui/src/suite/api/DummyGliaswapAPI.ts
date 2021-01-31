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
  LiquidityPoolFilter,
  LiquidityRequestSummary,
  SerializedTransactionToSignWithFee,
  SwapOrder,
} from '@gliaswap/commons';
import { Transaction } from '@lay2/pw-core';
import CKB from '@nervosnetwork/ckb-sdk-core';
import { assetList } from 'mock/asset-list';
import { swapOrders } from 'mock/order-list';
import { CKB_NODE_URL } from 'suite/constants';
import { TransactionConfig } from 'web3-core';
import { ckbNativeAsset, ckbSudtGlia } from '../placeholder/assets';

const dummyPoolId = '0x78320c53ae665b97c4f9ec699d23fb59cfac959ec3d780c853760a449258bc2f';

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

  async generateCancelLiquidityRequestTransaction(
    _payload: GenerateCancelRequestTransactionPayload,
  ): Promise<SerializedTransactionToSignWithFee> {
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
        poolId: dummyPoolId,
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
      poolId: dummyPoolId,
      assets: [
        { ...ckbNativeAsset, balance: '9876543210' },
        { ...ckbSudtGlia, balance: '1234567890' },
      ],
      lpToken: { ...ckbSudtGlia, balance: '654312789' },
      model: 'UNISWAP',
    });
  }

  async getLiquidityOperationSummaries(): Promise<LiquidityRequestSummary[]> {
    return [
      {
        txHash: '0x78320c53ae665b97c4f9ec699d23fb59cfac959ec3d780c853760a449258bc2f',
        poolId: dummyPoolId,
        time: '2021-01-01 11:11:11',
        model: 'UNISWAP',
        assets: [
          { ...ckbNativeAsset, balance: '123456789' },
          { ...ckbSudtGlia, balance: '123456789' },
        ],
        status: 'pending',
        lpToken: { ...ckbSudtGlia, balance: '123456789' },
        type: 'add',
      },
      {
        txHash: '0x28ca89c6491ac4ac43f2f37c47fffafaae0d35ac8cc5251005ee72c399a20685',
        poolId: dummyPoolId,
        time: '2021-01-01 11:11:11',
        model: 'UNISWAP',
        assets: [
          { ...ckbNativeAsset, balance: '123456789' },
          { ...ckbSudtGlia, balance: '123456789' },
        ],
        status: 'pending',
        lpToken: { ...ckbSudtGlia, balance: '1' },
        type: 'remove',
      },
    ];
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
