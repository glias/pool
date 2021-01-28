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
} from '@gliaswap/commons';

import {
  ckbNativeAsset,
  ckbNativeWithBalance,
  ckbSudtGlia,
  ckbSudtGliaWithBalance,
  ethErc20Usdt,
  ethErc20UsdtWithBalance,
  ethNativeAsset,
  ethNativeWithBalance,
} from '../placeholder/assets';

export class DummyGliaswapAPI implements GliaswapAPI {
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
    return [ckbNativeAsset];
  }

  async getAssetList(): Promise<Asset[]> {
    return [ckbNativeAsset, ckbSudtGlia, ethNativeAsset, ethErc20Usdt];
  }

  async getAssetsWithBalance() {
    return [
      {
        ...ckbNativeWithBalance,
        balance: String(Math.floor(1e12 * Math.random())),
        locked: String(Math.floor(1e12 * Math.random())),
        occupied: String(Math.floor(1e12 * Math.random())),
      },
      ckbSudtGliaWithBalance,
      ethNativeWithBalance,
      ethErc20UsdtWithBalance,
    ];
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
}
