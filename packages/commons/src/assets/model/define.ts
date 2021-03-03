import { Asset, ChainSpec } from '..';

export type DerivedFromChainPredicate<T extends Asset> = <I extends Asset>(x: I) => x is I & T;

/**
 * utility for TypeScript
 */
export function predicate<T extends Asset>(pred: (x: Asset) => boolean): DerivedFromChainPredicate<T> {
  return pred as DerivedFromChainPredicate<T>;
}

export interface AssetModel<A extends Asset, S extends ChainSpec> {
  readonly chainType: string;
  /**
   * Get the identifier of an asset. For example, the contract address of an ERC20
   */
  identity: (x: A) => string;

  getChainSpec: (asset: A) => S;

  /**
   * Check if the two assets are equal
   */
  equals: (a: A, b: A) => boolean;

  /**
   * Detect if an asset is derived from this chain
   */
  isCurrentChainAsset: DerivedFromChainPredicate<A>;

  /**
   * Detect if an asset is derived from this chain
   */
  isNativeAsset: DerivedFromChainPredicate<A>;
}

export type Extendable<T> = T & { extend: <E>(extension: E) => Extendable<T & E> };
export type ExtendableAssetModel<A extends Asset, S extends ChainSpec> = Extendable<AssetModel<A, S>>;

export function extendable<T>(raw: T): Extendable<T> {
  const extend = <E>(extension: E) => extendable(Object.assign({}, raw, extension));
  return Object.assign({}, raw, { extend }) as Extendable<T>;
}

export interface DefineAssetModelOptions<A extends Asset, S extends ChainSpec> {
  chainType: S['chainType'];
  /**
   * Get the identifier of an asset. For example, the contract address of an ERC20
   */
  identity: (x: A) => string;

  /**
   * Detect if an asset is derived from this chain. If not provided, the {@link chainType} is used to determine
   */
  isCurrentChainAsset?: (x: Asset) => boolean;

  /**
   * Detect if an asset is derived from this chain
   */
  isNativeAsset?: (x: Asset) => boolean;

  /**
   * Check if the two assets are equal. If not provided, the {@link identity} is used to determine
   */
  equals?: (a: A, b: A) => boolean;

  /**
   * Get {@link ChainSpec} from an asset. If not provided, will only get a plain {@link ChainSpec}
   */
  getChainSpec?: (asset: A) => S;
}

export function defineAssetModel<A extends Asset, S extends ChainSpec>(
  options: DefineAssetModelOptions<A, S>,
): ExtendableAssetModel<A, S> {
  const { identity, chainType } = options;

  if (!identity) throw new Error('identity is required in options');
  if (!chainType) throw new Error('chainType is required in options');

  const isCurrentChainAsset = (() => {
    if (options.isCurrentChainAsset) return options.isCurrentChainAsset;
    return predicate<A>((asset) => asset.chainType === chainType);
  })();

  const getChainSpec: DefineAssetModelOptions<A, S>['getChainSpec'] =
    options.getChainSpec ?? ((asset) => ({ chainType: asset.chainType } as S));

  if (!identity) throw new Error('The identity is required when define an AssetModel');

  const model = {
    chainType,
    identity,
    getChainSpec,
    isCurrentChainAsset: isCurrentChainAsset,
    isNativeAsset: options.isNativeAsset,
    equals: (a: A, b: A) => identity(a) === identity(b),
  } as AssetModel<A, S>;

  return extendable(model) as ExtendableAssetModel<A, S>;
}
