import {
  Asset,
  GliaswapAssetWithBalance,
  isCkbNativeAsset,
  isCkbSudtAsset,
  // isEthErc20Dai,
  // isEthErc20Usdc,
  // isEthErc20Usdt,
  // isEthNativeAsset,
  utils,
} from '@gliaswap/commons';
import BigNumber from 'bignumber.js';

export function BN(value: BigNumber.Value): BigNumber {
  return new BigNumber(value || 0);
}

export function getIconBackgroundColor(asset: Asset): string {
  if (isCkbNativeAsset(asset) || isCkbSudtAsset(asset)) return '#D9E8E2';
  return '#C1C8E2';
  // if (isEthNativeAsset(asset)) return '#c1c8e2';
  // if (isEthErc20Usdt(asset)) return '#b0e3d4';
  // if (isEthErc20Usdc(asset)) return '#b3d0f0';
  // if (isEthErc20Dai(asset)) return '#efddbf';
  // return '#eee';
}

/**
 * total balances including locked and occupied (CKB only)
 */
export function calcTotalBalance(asset: Asset | GliaswapAssetWithBalance): BigNumber {
  if (utils.has(asset, 'balance')) {
    if (isCkbNativeAsset(asset)) return BN(asset.balance).plus(asset.locked).plus(asset.occupied);
    if (isCkbSudtAsset(asset)) return BN(asset.balance).plus(asset.locked);
    return BN(asset.balance);
  }
  return BN(0);
}
