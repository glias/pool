import { Asset, ChainSpecOf } from '..';

function notImplemented(): never {
  throw new Error('The method is not implemented');
}

export type DerivedFromChainPredicate<T> = <I>(x: I) => x is I & T;

/**
 * utility for TypeScript
 */
export function predicate<T extends Asset>(pred: <I extends Asset>(x: I) => boolean): DerivedFromChainPredicate<T> {
  return pred as DerivedFromChainPredicate<T>;
}

export interface AssetModel<
  A extends Asset,
  N = unknown // Spec of the native asset
> {
  readonly chainType: string;
  /**
   * Get the identifier of an asset. For example, the contract address of an ERC20
   */
  identity: (x: A) => string;

  getChainSpec: (asset: A) => ChainSpecOf<A>;

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
  isNativeAsset: DerivedFromChainPredicate<A & N>;
}

export type Extendable<T> = T & { extend: <E>(extension: E) => Extendable<T & E> };
export type ExtendableAssetModel<A extends Asset, N = unknown> = Extendable<AssetModel<A, N>>;

/**
 * Turning a plain object into an extensible object
 * @example
 * ```ts
 * const raw = { sayHello: () => console.log('hello') }
 * const extendableRaw = extendable(raw)
 *
 * const extended = extendableRaw.extend({ sayHi: () => console.log('hi') })
 *   .extend({ sayHey: () => console.log('hey') })
 *
 *  extended.sayHey();
 *  extended.sayHi();
 *  ```
 */
export function extendable<Raw>(raw: Raw): Extendable<Raw> {
  const extend = <E>(extension: E) => extendable(Object.assign({}, raw, extension));
  return Object.assign({}, raw, { extend }) as Extendable<Raw>;
}

export interface DefineAssetModelOptions<A extends Asset> {
  chainType: ChainSpecOf<A>['chainType'];
  /**
   * Get the identifier of an asset. For example, the contract address of an ERC20
   */
  identity: (x: A) => string;

  /**
   * Detect if an asset is derived from this chain. If not provided, the {@link chainType} is used to determine
   */
  isCurrentChainAsset?: <X extends Asset>(x: X) => boolean;

  /**
   * Detect if an asset is derived from this chain
   */
  isNativeAsset?: <X extends Asset>(x: X) => boolean;

  /**
   * Check if the two assets are equal. If not provided, the {@link identity} is used to determine
   */
  equals?: (a: A, b: A) => boolean;

  /**
   * Get {@link ChainSpec} from an asset. If not provided, will only get a plain {@link ChainSpec}
   */
  getChainSpec?: (asset: A) => ChainSpecOf<A>;
}

export function defineAssetModel<A extends Asset, N = unknown>(
  options: DefineAssetModelOptions<A>,
): ExtendableAssetModel<A, N> {
  const { identity, chainType } = options;

  if (!identity) throw new Error('identity is required in options');
  if (!chainType) throw new Error('chainType is required in options');

  const isCurrentChainAsset = predicate<A>(options.isCurrentChainAsset ?? ((asset) => asset.chainType === chainType));

  const isNativeAsset = predicate<A>(options.isNativeAsset ?? notImplemented);

  const getChainSpec: DefineAssetModelOptions<A>['getChainSpec'] =
    options.getChainSpec ?? ((asset) => ({ chainType: asset.chainType } as ChainSpecOf<A>));

  const equals =
    options.equals ??
    ((a: A, b: A) => {
      if (!a || !b) return false;
      return identity(a) === identity(b);
    });

  if (!identity) throw new Error('The identity is required when define an AssetModel');

  const model: AssetModel<A, N> = {
    chainType,
    identity,
    getChainSpec,
    equals,
    isCurrentChainAsset,
    isNativeAsset,
  };

  return extendable(model);
}
