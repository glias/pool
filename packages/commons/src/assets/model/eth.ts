import { has, propEq } from '../../utils';
import { EthAsset, EthChainSpec, ShadowFromEthAsset } from '../types';
import { CkbModel } from './ckb';
import { defineAssetModel, predicate } from './define';

const RawEthModel = defineAssetModel<EthAsset, EthChainSpec>({
  chainType: 'Ethereum',
  identity: (asset) => asset.address,
  getChainSpec: (asset) => ({ address: asset.address, chainType: asset.chainType }),
  isCurrentChainAsset: (asset) => propEq(asset, 'chainType', 'Ethereum') && has(asset, 'address'),
  isNativeAsset: (asset) => propEq(asset, 'address', '0x0000000000000000000000000000000000000000'),
});

export const EthModel = RawEthModel.extend({
  isShadowEthAsset: predicate<ShadowFromEthAsset>(
    (asset) => CkbModel.isCurrentChainAsset(asset) && has(asset, 'shadowFrom'),
  ),
  isEthErc20Asset: predicate<EthAsset>(
    (asset) => RawEthModel.isCurrentChainAsset(asset) && !RawEthModel.isNativeAsset(asset),
  ),
});
