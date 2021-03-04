import { has, propEq } from '../../utils';
import { CkbAsset, CkbChainSpec } from '../types';
import { defineAssetModel, predicate } from './';

const RawCkbModel = defineAssetModel<CkbAsset, CkbChainSpec>({
  chainType: 'Nervos',
  identity: (asset) => asset.typeHash,
  getChainSpec: (asset) => ({ typeHash: asset.typeHash, chainType: asset.chainType }),
  isCurrentChainAsset: (asset) => propEq(asset, 'chainType', 'Nervos') && has(asset, 'typeHash'),
  isNativeAsset: (asset) =>
    propEq(asset, 'typeHash', '0x0000000000000000000000000000000000000000000000000000000000000000'),
});

export const CkbModel = RawCkbModel.extend({
  isCkbSudtAsset: predicate<CkbAsset>(
    (asset) => RawCkbModel.isCurrentChainAsset(asset) && !RawCkbModel.isNativeAsset(asset),
  ),
});
