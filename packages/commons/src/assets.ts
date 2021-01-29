import { CommonsEnv } from './env';
import { has, propEq } from './utils';

export type ChainType = 'Nervos' | 'Ethereum';
export type Script = CKBComponents.Script;

export interface ChainSpec {
  chainType: ChainType;
}

export interface Asset extends ChainSpec {
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

// the asset with the balance
export type AssetWithBalance = Balanced & Asset;

export type CkbChainSpec = { chainType: 'Nervos'; typeHash: string };
export type CkbAsset = CkbChainSpec & Asset;
export type GliaswapLockedBalance = Balanced & LockedBalance;
// prettier-ignore
export type CkbNativeAsset =
  CkbAsset
  & { typeHash: '0x0000000000000000000000000000000000000000000000000000000000000000'; };
export type CkbSudtAsset = CkbAsset;
export type CkbAssetWithBalance = CkbAsset & Balanced;
export type CkbNativeAssetWithBalance = CkbNativeAsset & GliaswapLockedBalance & OccupiedBalance;
export type CkbSudtAssetWithBalance = CkbSudtAsset & GliaswapLockedBalance;

// A shadow asset is a counterpart that crossed to a CKB from another chain, such as an ETH native token crossing over to ckETH
export type ShadowFromEth = { shadowFrom: EthAsset };
export type ShadowFromEthAsset = CkbAsset & ShadowFromEth;
export type ShadowFromEthWithBalance = ShadowFromEthAsset & GliaswapLockedBalance;

export type EthChainSpec = { chainType: 'Ethereum'; address: string };
export type EthAsset = EthChainSpec & Asset;
// prettier-ignore
export type EthNativeAsset = EthAsset & { address: '0x0000000000000000000000000000000000000000'; };
export type EthErc20Asset = EthAsset;
export type EthNativeAssetWithBalance = EthNativeAsset & Balanced;
export type EthErc20AssetWithBalance = EthErc20Asset & Balanced;

export type GliaswapAssetWithBalance =
  | CkbNativeAssetWithBalance
  | CkbSudtAssetWithBalance
  | EthNativeAssetWithBalance
  | EthErc20AssetWithBalance;

export function isCkbChainSpec(spec: ChainSpec): spec is CkbChainSpec {
  return propEq(spec, 'chainType', 'Nervos') && has(spec, 'typeHash');
}

export function getCkbChainSpec<T extends CkbChainSpec>(spec: T): CkbChainSpec {
  return { typeHash: spec.typeHash, chainType: spec.chainType };
}

export function isEthereumChainSpec(spec: ChainSpec): spec is EthChainSpec {
  return propEq(spec, 'chainType', 'Ethereum') && has(spec, 'address');
}

export function getEthChainSpec<T extends EthChainSpec>(spec: T): EthChainSpec {
  return { address: spec.address, chainType: spec.chainType };
}

export function isCkbAsset<T extends Asset>(asset: T): asset is T & CkbAsset {
  return isCkbChainSpec(asset);
}

export function isEthAsset<T extends Asset>(asset: T): asset is T & EthAsset {
  return isEthereumChainSpec(asset);
}

export function isCkbNativeAsset<T extends Asset>(asset: Asset): asset is T & CkbNativeAsset {
  return (
    isCkbAsset(asset) && propEq(asset, 'typeHash', '0x0000000000000000000000000000000000000000000000000000000000000000')
  );
}

export function isCkbSudtAsset<T extends Asset>(asset: T): asset is T & CkbSudtAsset {
  return isCkbAsset(asset) && !isCkbNativeAsset(asset);
}

export function isShadowEthAsset<T extends Asset>(asset: T): asset is T & ShadowFromEthAsset {
  return isCkbSudtAsset(asset) && has(asset, 'shadowFrom');
}

export function isEthNativeAsset<T extends Asset>(asset: T): asset is T & EthNativeAsset {
  return isEthAsset(asset) && asset.address === '0x0000000000000000000000000000000000000000';
}

export function isEthErc20Asset<T extends Asset>(asset: T): asset is T & EthErc20Asset {
  return isEthAsset(asset) && !isEthNativeAsset(asset);
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
