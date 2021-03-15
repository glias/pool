import { has, propEq } from '../utils';

export type ChainType = 'Nervos' | 'Ethereum';
export type Script = CKBComponents.Script;

export type ChainSpec<Name extends string = string, Spec = unknown> = {
  chainType: Name;
} & Spec;

export type Asset<C extends string = string, S = unknown> = {
  name: string;
  decimals: number;
  symbol: string;
  logoURI?: string;
} & ChainSpec<C, S>;

export type ChainSpecOf<T> = T extends Asset<infer Chain, infer Spec> ? ChainSpec<Chain, Spec> : never;
export type SpecOf<T> = T extends Asset<infer _C, infer Spec> ? Spec : never;

export type BalanceValue = string;
// the free balance
export type Balanced = { balance: BalanceValue };
// the balance locked in Gliaswap
export type LockedBalance = { locked: BalanceValue };
// the balance occupied(CKB only)
export type OccupiedBalance = { occupied: BalanceValue };

// the asset with the balance
export type AssetWithBalance = Balanced & Asset;

export type CkbChainSpec = ChainSpec<'Nervos', { typeHash: string }>;
export type CkbNativeSpec = CkbChainSpec & {
  typeHash: '0x0000000000000000000000000000000000000000000000000000000000000000';
};

export type CkbAsset = CkbChainSpec & Asset;
export type GliaswapLockedBalance = Balanced & LockedBalance;
// prettier-ignore
export type CkbNativeAsset = CkbAsset & CkbNativeSpec;
export type CkbSudtAsset = CkbAsset;
export type CkbAssetWithBalance = CkbAsset & Balanced;
export type CkbNativeAssetWithBalance = CkbNativeAsset & GliaswapLockedBalance & OccupiedBalance;
export type CkbSudtAssetWithBalance = CkbSudtAsset & GliaswapLockedBalance;

// A shadow asset is a counterpart that crossed to a CKB from another chain, such as an ETH native token crossing over to ckETH
export type ShadowFromEth = { shadowFrom: EthAsset };
export type ShadowFromEthAsset = CkbAsset & ShadowFromEth;
export type ShadowFromEthWithBalance = ShadowFromEthAsset & GliaswapLockedBalance;

export type EthChainSpec = ChainSpec<'Ethereum', { address: string }>;
export type EthAsset = Asset<'Ethereum', { address: string }>;

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

/**
 * @deprecated migrate to {@link CkbModel.isCurrentChainAsset}
 */
export function isCkbChainSpec<T extends ChainSpec>(spec: T): spec is T & CkbChainSpec {
  return propEq(spec, 'chainType', 'Nervos') && has(spec, 'typeHash');
}

/**
 * @deprecated migrate to {@link CkbModel.getChainSpec}
 * @param spec
 */
export function getCkbChainSpec<T extends CkbChainSpec>(spec: T): CkbChainSpec {
  return { typeHash: spec.typeHash, chainType: spec.chainType };
}

/**
 * @deprecated migrate to {@link EthModel.isCurrentChainAsset}
 */
export function isEthereumChainSpec<T extends ChainSpec>(spec: T): spec is T & EthChainSpec {
  return propEq(spec, 'chainType', 'Ethereum') && has(spec, 'address');
}

/**
 * @deprecated migrate to {@link EthModel.getChainSpec}
 * @param spec
 */
export function getEthChainSpec<T extends EthChainSpec>(spec: T): EthChainSpec {
  return { address: spec.address, chainType: spec.chainType };
}

/**
 * @deprecated migrate to {@link CkbModel.isCurrentChainAsset}
 */
export function isCkbAsset<T extends Asset>(asset: T): asset is T & CkbAsset {
  return isCkbChainSpec(asset);
}

/**
 * @deprecated migrate to {@link EthModel.isCurrentChainAsset}
 */
export function isEthAsset<T extends Asset>(asset: T): asset is T & EthAsset {
  return isEthereumChainSpec(asset);
}

/**
 * @deprecated migrate to {@link CkbModel.isCurrentChainAsset}
 */
export function isCkbNativeAsset<T extends Asset>(asset: Asset): asset is T & CkbNativeAsset {
  return (
    isCkbAsset(asset) && propEq(asset, 'typeHash', '0x0000000000000000000000000000000000000000000000000000000000000000')
  );
}

/**
 * @deprecated migrate to {@link CkbModel.isCurrentChainAsset}
 */
export function isCkbSudtAsset<T extends Asset>(asset: T): asset is T & CkbSudtAsset {
  return isCkbAsset(asset) && !isCkbNativeAsset(asset);
}

/**
 * @deprecated migrate to {@link EthModel.isShadowEthAsset}
 */
export function isShadowEthAsset<T extends Asset>(asset: T): asset is T & ShadowFromEthAsset {
  return isCkbSudtAsset(asset) && has(asset, 'shadowFrom');
}

/**
 * @deprecated migrate to {@link EthModel.isNativeAsset}
 */
export function isEthNativeAsset<T extends Asset>(asset: T): asset is T & EthNativeAsset {
  return isEthAsset(asset) && asset.address === '0x0000000000000000000000000000000000000000';
}

/**
 * @deprecated migrate to {@link EthModel.isCurrentChainAsset}
 */
export function isEthErc20Asset<T extends Asset>(asset: T): asset is T & EthErc20Asset {
  return isEthAsset(asset) && !isEthNativeAsset(asset);
}
