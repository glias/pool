import {
  Asset,
  AssetWithBalance,
  ChainSpec,
  GliaswapAssetWithBalance,
  isCkbNativeAsset,
  isCkbSudtAsset,
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

export function createAssetWithBalance<T extends ChainSpec>(
  asset: T | Partial<Asset>,
  balance: BigNumber.Value = 0,
): T & AssetWithBalance {
  return {
    chainType: 'Nervos',
    name: 'unknown',
    symbol: 'unknown',
    decimals: 0,
    ...asset,
    balance: BN(balance).decimalPlaces(0, BigNumber.ROUND_FLOOR).toString(),
  } as T & AssetWithBalance;
}

export function inputToAssetBalance(input: string, asset: Asset, decimalPlaces = asset.decimals): BigNumber {
  return BN(input)
    .times(10 ** asset.decimals)
    .decimalPlaces(decimalPlaces, BigNumber.ROUND_FLOOR);
}

export function assetBalanceToInput(balance: BigNumber.Value, asset: Asset, decimalPlaces = asset.decimals): BigNumber {
  return BN(balance)
    .times(10 ** -asset.decimals)
    .decimalPlaces(decimalPlaces, BigNumber.ROUND_DOWN);
}

export { BalanceWithoutDecimal, BalanceWithDecimal } from './helper/AssetBalance';
