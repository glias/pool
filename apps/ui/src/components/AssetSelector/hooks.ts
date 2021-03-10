import { Asset } from '@gliaswap/commons';
import update from 'immutability-helper';
import { Key, useState } from 'react';

export interface AssetSelectorHooks<A extends Asset, K extends Key = number> {
  defaultSelectedKeys?: K[];
  assets: A[];
  renderKey?: (asset: A, indexOfAssets: number, assets: A[]) => K;
}

export interface UseAssetSelectorHook<A extends Asset, K extends Key> {
  selectedKeys: K[];
  appendSelectedKey: (key: K) => void;
  removeSelectedKey: (key: K) => void;
  setSelectedKeys: (keys: K[]) => void;
  getSelectedAssets: () => A[];
}

export function useAssetSelector<A extends Asset, K extends Key>(
  options: AssetSelectorHooks<A, K>,
): UseAssetSelectorHook<A, K> {
  const { defaultSelectedKeys, assets, renderKey = (_, index) => index } = options;
  const [selectedKeys, setSelectedKeys] = useState<K[]>(defaultSelectedKeys || []);

  function appendSelectedKey(key: K) {
    setSelectedKeys(selectedKeys.concat(key));
  }

  function removeSelectedKey(key: K) {
    const foundIndex = selectedKeys.indexOf(key);
    if (foundIndex === -1) return;

    update(selectedKeys, { $splice: [[foundIndex, 1]] });
  }

  function getSelectedAssets() {
    return assets.filter((asset, i) => renderKey(asset, i, assets));
  }

  return {
    selectedKeys,
    setSelectedKeys,
    appendSelectedKey,
    removeSelectedKey,
    getSelectedAssets,
  };
}
