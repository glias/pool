import { Tabs } from 'antd';
import { Asset } from 'commons/MultiAsset';
import React, { useMemo } from 'react';
import { AssetList, AssetListProps } from './AssetList';

type Group = (asset: Asset) => string;

export interface GroupedAssetListProps extends AssetListProps {
  group: Group;
}

type GroupedAsset = Record<string, Asset[]>;

function groupBy(group: Group, assets: Asset[]) {
  return assets.reduce<GroupedAsset>((result, item) => {
    const groupKey = group(item);
    result[groupKey] = groupKey in result ? result[groupKey].concat(item) : [item];
    return result;
  }, {});
}

export const GroupedAssetList: React.FC<GroupedAssetListProps> = (props) => {
  const { group, assets, onSelected } = props;

  const grouped = useMemo(() => groupBy(group, assets), [assets, group]);

  return (
    <Tabs>
      {Object.entries(grouped).map(([groupKey, groupedAssets]) => {
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
};
