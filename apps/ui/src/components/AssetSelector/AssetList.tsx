import { Asset } from '@gliaswap/commons';
import { HumanizeBalance } from 'components/Balance';
import React, { Key } from 'react';
import styled from 'styled-components';
import { calcTotalBalance } from 'suite';
import { AssetSymbol } from '../AssetSymbol';

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

export interface AssetListProps<T extends Asset = Asset> {
  renderKey: (asset: T, index: number, data: Asset[]) => Key;
  assets: T[];
  disabledKeys?: Key[];
  onSelected?: (key: Key, asset: T) => void;
}

export function AssetList<T extends Asset>(
  props: React.PropsWithChildren<AssetListProps<T>> & React.HTMLAttributes<HTMLUListElement>,
) {
  const { assets, onSelected, disabledKeys, ...wrapperProps } = props;

  const listNode = assets.map((asset, i) => {
    const assetNode = (
      <>
        <AssetSymbol asset={asset} />
        <HumanizeBalance asset={asset} value={calcTotalBalance(asset)} />
      </>
    );
    const key = props.renderKey(asset, i, assets);
    const itemDisabled = disabledKeys?.includes(key);

    return (
      <li
        key={key}
        className={itemDisabled ? 'disabled' : ''}
        onClick={() => !itemDisabled && onSelected?.(key, asset)}
      >
        {assetNode}
      </li>
    );
  });

  return <AssetListWrapper {...wrapperProps}>{listNode}</AssetListWrapper>;
}
