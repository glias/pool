import { CkbModel } from './ckb';
import { EthModel } from './eth';
import { ModelMap, registerModelMap } from './register';

export { defineAssetModel, AssetModel, ExtendableAssetModel, predicate } from './define';
export { CkbModel, EthModel, registerModelMap, ModelMap };

/**
 * @example
 * ```ts
 * const sudt1: CkbAsset = ...;
 * const sudt2: CkbAsset = ...;
 *
 * Models.get('Nervos')?.equals(sudt1, sudt2)
 * Models.get(sudt1)?.equals(sudt1, sudt2)
 * ```
 */
export const Models = registerModelMap().register(CkbModel).register(EthModel);
