import { Asset } from '@gliaswap/commons';
import { AssetSymbol } from 'components/Asset';
import { HumanizeBalance } from 'components/Balance';
import React, { Key } from 'react';
import styled from 'styled-components';
import { calcTotalBalance, getAvailableBalance } from 'suite';

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

export interface AssetListProps<A extends Asset, K extends Key> {
  renderKey: (asset: A, index: number, data: A[]) => K;
  assets: A[];
  disabledKeys?: K[];
  onSelected?: (key: K, asset: A) => void | Promise<void>;
  enableSearch?: boolean;
  filterValue?: string;
  showAvailableBalance?: boolean;
  groupFilter?: (key: K) => boolean;
}

export function AssetList<A extends Asset, K extends Key>(
  props: React.PropsWithChildren<AssetListProps<A, K>> & React.HTMLAttributes<HTMLUListElement>,
) {
  const { assets, onSelected, disabledKeys, filterValue, showAvailableBalance = false, ...wrapperProps } = props;
  const listNode = assets
    .filter(
      filterValue && !filterValue.startsWith('0x')
        ? (a) => a.name.toLowerCase().includes(filterValue.toLowerCase())
        : Boolean,
    )
    .map((asset, i) => {
      const assetNode = (
        <>
          <AssetSymbol asset={asset} />
          <HumanizeBalance
            asset={asset}
            value={showAvailableBalance ? calcTotalBalance(asset) : getAvailableBalance(asset)}
          />
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
