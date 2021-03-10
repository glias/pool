import { ManagerAsset, useAssetManager } from 'components/AssetManager/hooks';
import { AssetList as RawAssetList } from 'components/AssetSelector/AssetList';
import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

const AssetListWrapper = styled.div`
  font-size: 16px;
  li {
    padding: 16px;
  }
`;

export const AssetList: React.FC = () => {
  const { push } = useHistory();
  const { assets } = useAssetManager();

  const onSelected = useCallback(
    (asset: ManagerAsset) => {
      push(`/assets/${asset.typeHash}`);
    },
    [push],
  );

  return (
    <AssetListWrapper>
      <RawAssetList
        assets={assets}
        renderKey={(asset) => asset.typeHash}
        onSelected={(key, asset) => onSelected(asset)}
      />
    </AssetListWrapper>
  );
};
