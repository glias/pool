import {
  Asset,
  GliaswapAPI,
  LiquidityInfo,
  LiquidityOrderSummary,
  LiquidityPoolFilter,
  SwapOrder,
} from '@gliaswap/commons';
import { Transaction } from '@lay2/pw-core';
import { TransactionConfig } from 'web3-core';

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

import { swapIrders } from 'mock/order-list';

export class DummyGliaswapAPI implements GliaswapAPI {
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
          { ...ckbNativeAsset, balance: '1234567890' },
          { ...ckbSudtGlia, balance: '9876543210' },
        ],
        lpToken: { ...ckbSudtGlia, balance: '9876543210' },
        model: 'UNISWAP',
      },
    ];
  }

  getLiquidityInfo(): Promise<LiquidityInfo> {
    return Promise.resolve({
      poolId: '0x1',
      assets: [
        { ...ckbNativeAsset, balance: '1234567890' },
        { ...ckbSudtGlia, balance: '9876543210' },
      ],
      lpToken: { ...ckbSudtGlia, balance: '9876543210' },
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
    return Promise.resolve(swapIrders);
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

  cancelSwapOrders(): Promise<Transaction> {
    return Promise.resolve(Object.create(null));
  }

  swapNormalOrder(): Promise<Transaction> {
    return Promise.resolve(Object.create(null));
  }
}
