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

import { ckbNativeAsset, ckbSudtGlia } from '../placeholder/assets';

import { swapOrders } from 'mock/order-list';
import { assetList } from 'mock/asset-list';
import CKB from '@nervosnetwork/ckb-sdk-core';
import { CKB_NODE_URL } from 'suite/constants';

export class DummyGliaswapAPI implements GliaswapAPI {
  ckb = new CKB(CKB_NODE_URL);

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

  cancelSwapOrders(): Promise<Transaction> {
    return Promise.resolve(Object.create(null));
  }

  swapNormalOrder(): Promise<Transaction> {
    return Promise.resolve(Object.create(null));
  }
}
