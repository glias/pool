import { Asset, GliaswapAPI } from '@gliaswap/commons';

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
  getDefaultAssetList() {
    return [ckbNativeAsset];
  }

  async getAssetList(): Promise<Asset[]> {
    return [ckbNativeAsset, ckbSudtGlia, ethNativeAsset, ethErc20Usdt];
  }

  async getAssetsWithBalance() {
    return [ckbNativeWithBalance, ckbSudtGliaWithBalance, ethNativeWithBalance, ethErc20UsdtWithBalance];
  }
}
