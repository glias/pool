import { Asset } from '@gliaswap/commons';
import { Tabs } from 'antd';
import React, { Key, useMemo } from 'react';
import { AssetList, AssetListProps } from './AssetList';

type Group<T> = (asset: T) => string;

export interface GroupedAssetListProps<A extends Asset, K extends Key> extends AssetListProps<A, K> {
  group: Group<A>;
}

type GroupedAsset<A> = Record<string, A[]>;

function groupBy<A>(group: Group<A>, assets: A[]): GroupedAsset<A> {
  return assets.reduce<GroupedAsset<A>>((result, item) => {
    const groupKey = group(item);
    result[groupKey] = groupKey in result ? result[groupKey].concat(item) : [item];
    return result;
  }, {});
}

export function GroupedAssetList<A extends Asset, K extends Key>(props: GroupedAssetListProps<A, K>) {
  const { group, assets, onSelected } = props;

  const grouped = useMemo(() => groupBy(group, assets), [assets, group]);

  return (
    <Tabs>
      {Object.entries<A[]>(grouped).map(([groupKey, groupedAssets]) => {
        return (
          <Tabs.TabPane key={groupKey} tab={groupKey}>
            <AssetList
              assets={groupedAssets}
              onSelected={onSelected}
              disabledKeys={props.disabledKeys}
              renderKey={(asset) => props.renderKey(asset, assets.indexOf(asset), groupedAssets)}
            />
          </Tabs.TabPane>
        );
      })}
    </Tabs>
  );
}
