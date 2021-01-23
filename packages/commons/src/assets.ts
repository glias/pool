import { CommonsEnv } from './env';
import { has, propEq } from './utils';

export type ChainType = 'Nervos' | 'Ethereum';
export type Script = CKBComponents.Script;

export interface Asset {
  chainType: ChainType;

  name: string;
  decimals: number;
  symbol: string;
  logoURI?: string;
}
export type BalanceValue = string;
// the free balance
export type Balanced = { balance: BalanceValue };
// the balance locked in Gliaswap
export type LockedBalance = { locked: BalanceValue };
// the balance occupied(CKB only)
export type OccupiedBalance = { occupied: BalanceValue };

export type Shadow = { shadowFrom: EthAsset };

export type ShadowAsset = CkbAsset & Shadow;

export type ShadowAssetWithBalance = ShadowAsset & CkbSudtAssetWithBalance;

// the asset with the balance
export interface AssetWithBalance extends Balanced, Asset {}

export type CkbAsset = Asset & { chainType: 'Nervos'; typeHash: string };
export type GliaswapLockedBalance = Balanced & LockedBalance;
// prettier-ignore
export type CkbNativeAsset = CkbAsset & { typeHash: string; };
export type CkbSudtAsset = CkbAsset;
export type CkbNativeAssetWithBalance = CkbNativeAsset & GliaswapLockedBalance & OccupiedBalance;
export type CkbSudtAssetWithBalance = CkbSudtAsset & GliaswapLockedBalance;

export type EthAsset = Asset & { chainType: 'Ethereum'; address: string };
// prettier-ignore
export type EthNativeAsset = EthAsset & { address: '0x0000000000000000000000000000000000000000'; };
export type EthErc20Asset = EthAsset;
export type EthNativeAssetWithBalance = EthNativeAsset & Balanced;
export type EthErc20AssetWithBalance = EthErc20Asset & Balanced;

export type GliaswapAssetWithBalance =
  | CkbNativeAssetWithBalance
  | CkbSudtAssetWithBalance
  | ShadowAssetWithBalance
  | EthNativeAssetWithBalance
  | EthErc20AssetWithBalance;

export function isCkbAsset(asset: Asset): asset is CkbAsset {
  return propEq(asset, 'chainType', 'Nervos');
}

export function isEthAsset(asset: Asset): asset is EthAsset {
  return propEq(asset, 'chainType', 'Ethereum');
}

export function isCkbNativeAsset(asset: Asset): asset is CkbNativeAsset {
  return (
    isCkbAsset(asset) && propEq(asset, 'typeHash', '0x0000000000000000000000000000000000000000000000000000000000000000')
  );
}

export function isCkbSudtAsset(asset: Asset): asset is CkbSudtAsset {
  return isCkbAsset(asset) && !isCkbNativeAsset(asset);
}

export function isEthNativeAsset(asset: Asset): asset is EthNativeAsset {
  return propEq(asset, 'address', '0x0000000000000000000000000000000000000000');
}

export function isEthErc20Asset(asset: Asset): asset is EthErc20Asset {
  return has(asset, 'address');
}

export function isEthErc20Usdt(asset: Asset): asset is EthErc20Asset {
  // TODO
  return isEthErc20Asset(asset) && asset.address === CommonsEnv.get('ERC20_USDT_ADDRESS');
}

export function isEthErc20Usdc(asset: Asset): asset is EthErc20Asset {
  // TODO
  return isEthErc20Asset(asset) && asset.address === CommonsEnv.get('ERC20_USDC_ADDRESS');
}

export function isEthErc20Dai(asset: Asset): asset is EthErc20Asset {
  // TODO
  return isEthErc20Asset(asset) && asset.address === CommonsEnv.get('ERC20_DAI_ADDRESS');
}
