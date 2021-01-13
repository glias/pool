import { Asset, Balance, isBalanced } from 'commons/MultiAsset';
import React, { Key } from 'react';
import styled from 'styled-components';
import { AssetSymbol } from '../AssetSymbol';

export interface AssetListProps {
  renderKey: (asset: Asset, index: number, data: Asset[]) => Key;
  assets: Asset[];
  disabledKeys?: Key[];
  onSelected?: (key: Key) => void;
}

const AssetListWrapper = styled.ul`
  padding-inline-start: 0;

  li {
    display: flex;
    justify-content: space-between;
    padding: 4px;
    cursor: pointer;

    .balance-integer {
      color: #7e7e7e;
    }

    &.disabled {
      opacity: 0.35;
    }

    :hover {
      background: #eee;
    }
  }
`;

export const AssetList: React.FC<AssetListProps> = (props) => {
  const { assets, onSelected, disabledKeys } = props;

  const listNode = assets.map((asset, i) => {
    const assetNode = isBalanced(asset) ? (
      <>
        <AssetSymbol asset={asset} />
        <Balance asset={asset} />
      </>
    ) : (
      <AssetSymbol asset={asset} />
    );
    const key = props.renderKey(asset, i, assets);
    const itemDisabled = disabledKeys?.includes(key);

    return (
      <li key={key} className={itemDisabled ? 'disabled' : ''} onClick={() => !itemDisabled && onSelected?.(key)}>
        {assetNode}
      </li>
    );
  });

  return <AssetListWrapper>{listNode}</AssetListWrapper>;
};
