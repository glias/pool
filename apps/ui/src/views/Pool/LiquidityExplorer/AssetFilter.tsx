import { PlusCircleOutlined } from '@ant-design/icons';
import { CkbAsset, CkbModel } from '@gliaswap/commons';
import { Tag } from 'antd';
import { AssetSelector } from 'components/AssetSelector';
import { useGliaswapAssets } from 'hooks';
import i18n from 'i18n';
import update from 'immutability-helper';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

interface AssetFilterProps {
  onChange: (assets: CkbAsset[]) => void;
}

export function useAssetFilter() {
  const [selectedAssets, setAssets] = useState<CkbAsset[]>([]);

  function indexOf(target: CkbAsset): number {
    return selectedAssets.findIndex((asset) => CkbModel.equals(asset, target));
  }

  function exists(target: CkbAsset): boolean {
    return indexOf(target) !== -1;
  }

  function add(asset: CkbAsset) {
    if (exists(asset)) return;
    setAssets(selectedAssets.concat(asset));
  }

  function remove(asset: CkbAsset) {
    const index = indexOf(asset);
    if (index === -1) return;
    setAssets((assets) => update(assets, { $splice: [[index, 1]] }));
  }

  return { selectedAssets: selectedAssets, add, remove, exists };
}

const AssetFilterWrapper = styled.span`
  display: inline-flex;
  align-items: center;

  .filter-text {
    color: #fff;
  }

  .filter-icon {
    color: #fff;
    cursor: pointer;
  }

  .ant-tag {
    border-radius: 16px;
    line-height: 1;
    padding: 8px;
    font-weight: bold;
  }
`;

export const AssetFilter = (props: AssetFilterProps) => {
  const { selectedAssets, add, remove } = useAssetFilter();
  const { ckbAssets } = useGliaswapAssets();
  const { onChange } = props;

  useEffect(() => {
    onChange(selectedAssets);
  }, [selectedAssets, onChange]);

  const disabledKeys = useMemo(() => selectedAssets.map(CkbModel.identity), [selectedAssets]);

  return (
    <AssetFilterWrapper>
      <span className="filter-text">{i18n.t('Filter by token')}&nbsp;&nbsp;</span>
      {selectedAssets.map((asset) => (
        <Tag key={asset.typeHash} closable onClose={() => remove(asset)}>
          {asset.symbol}
        </Tag>
      ))}
      {selectedAssets.length < 2 && (
        <AssetSelector
          enableSearch={true}
          renderKey={CkbModel.identity}
          assets={ckbAssets}
          disabledKeys={disabledKeys}
          onSelected={(_, asset) => add(asset)}
        >
          <PlusCircleOutlined className="filter-icon" />
        </AssetSelector>
      )}
    </AssetFilterWrapper>
  );
};
