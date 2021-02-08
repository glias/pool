import {
  Asset,
  AssetWithBalance,
  ChainSpec,
  CkbAssetWithBalance,
  GliaswapAssetWithBalance,
  isCkbNativeAsset,
  isCkbSudtAsset,
  utils,
} from '@gliaswap/commons';
import BigNumber from 'bignumber.js';
import { Amount } from './AssetBalance';

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
  balance: Amount | BigNumber.Value = 0,
): T & AssetWithBalance {
  const decimals = 'decimals' in asset && typeof asset.decimals === 'number' ? asset.decimals : 0;

  return {
    chainType: 'Nervos',
    name: 'unknown',
    symbol: 'unknown',
    decimals,
    logoURI: '',
    ...asset,
    balance: Amount.from(balance, decimals).value.toString(),
  } as T & AssetWithBalance;
}

export function createNervosAssetPlaceholder(balance: BigNumber.Value = 0): CkbAssetWithBalance {
  return {
    chainType: 'Nervos',
    typeHash: '0x',
    name: 'unknown',
    symbol: 'unknown',
    logoURI: '',
    decimals: 0,
    balance: BN(balance).toString(),
  };
}

export { Amount } from './AssetBalance';
