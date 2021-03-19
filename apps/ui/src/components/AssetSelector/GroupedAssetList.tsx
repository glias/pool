import { SearchOutlined } from '@ant-design/icons';
import { Asset, ChainType, isCkbSudtAsset, isEthAsset } from '@gliaswap/commons';
import { Input, Tabs } from 'antd';
import { MetaContainer } from 'components/MetaContainer';
import { useGliaswap } from 'hooks';
import i18n from 'i18n';
import React, { Key, useMemo, useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';
import { AssetList, AssetListProps } from './AssetList';

const Container = styled.main`
  .search-token {
    margin-top: 8px;
  }
`;

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

enum SearchStatus {
  None,
  Invalid,
  Unregistered,
}

const SearchMeta = ({ status, chainType }: { status: SearchStatus; chainType: ChainType }) => {
  switch (status) {
    case SearchStatus.None:
      return null;
    case SearchStatus.Invalid:
      return (
        <MetaContainer>{i18n.t(`validation.${chainType === 'Ethereum' ? 'address' : 'type-hash'}`)}</MetaContainer>
      );
    case SearchStatus.Unregistered:
      return (
        <MetaContainer>
          <Trans
            defaults="Token info is needed before swapping this token. Please go to <a>Token Registry Center</a> to submit token info first."
            components={{
              // eslint-disable-next-line jsx-a11y/anchor-has-content
              a: <a href="https://github.com/glias/token-list" target="_blank" rel="noreferrer noopener" />,
            }}
          />
        </MetaContainer>
      );
    default:
      return null;
  }
};

export function GroupedAssetList<A extends Asset, K extends Key>(props: GroupedAssetListProps<A, K>) {
  const { group, assets, onSelected, enableSearch, balanceCaculator } = props;

  const grouped = useMemo(() => groupBy(group, assets), [assets, group]);
  const [searchValue, setSearchValue] = useState('');
  const [searchResult, setSearchResult] = useState<A | undefined>();
  const [searchStatus, setSearchStatus] = useState(SearchStatus.None);
  const [currentTab, setCurrentTab] = useState<ChainType>('Nervos');
  const { api } = useGliaswap();

  const sudtAssets = useMemo(() => {
    return assets.filter(isCkbSudtAsset);
  }, [assets]);

  const erc20Assets = useMemo(() => {
    return assets.filter(isEthAsset);
  }, [assets]);

  const handleSearchResult = useCallback(
    async (val: string, tab?: string) => {
      const latestTab = tab ?? currentTab;
      if (val === '') {
        return;
      }
      const asset =
        latestTab === 'Nervos'
          ? sudtAssets.find((a) => a.typeHash === val)
          : erc20Assets.find((e) => e.address.toLowerCase() === val.toLowerCase());
      const search = latestTab === 'Nervos' ? api.searchSUDT : api.searchERC20;
      if (asset) {
        setSearchResult(asset);
        setSearchStatus(SearchStatus.None);
      } else {
        const res = await search(val);
        if (res) {
          setSearchResult(res as any);
          setSearchStatus(SearchStatus.Unregistered);
        } else {
          setSearchResult(undefined);
          setSearchStatus(SearchStatus.Invalid);
        }
      }
    },
    [currentTab, erc20Assets, sudtAssets, api],
  );

  const searchOnChange = useCallback(
    (val: string, tab?: string) => () => {
      setSearchValue(val);
      if (val.startsWith('0x')) {
        handleSearchResult(val, tab);
      } else if (val === '') {
        setSearchResult(undefined);
        setSearchStatus(SearchStatus.None);
      }
    },
    [handleSearchResult],
  );

  const searchToken = useMemo(() => {
    if (enableSearch) {
      return (
        <Input
          prefix={<SearchOutlined />}
          placeholder={i18n.t(`common.search-by-${currentTab === 'Nervos' ? 'type-hash' : 'address'}`)}
          onChange={(e) => searchOnChange(e.target.value)()}
          value={searchValue}
          className="search-token"
        />
      );
    }

    return null;
  }, [enableSearch, searchOnChange, searchValue, currentTab]);

  return (
    <Container>
      {searchToken}
      <Tabs
        onChange={(e) => {
          setCurrentTab(e as ChainType);
          const tabOnChange = searchOnChange(searchValue, e);
          tabOnChange();
        }}
      >
        {Object.entries<A[]>(grouped).map(([groupKey, groupedAssets]) => {
          const assetList = searchResult ? [searchResult] : groupedAssets;
          const disabledKeys =
            searchResult && searchStatus !== SearchStatus.None
              ? [props.renderKey(searchResult, 0, assetList)]
              : props.disabledKeys;
          return (
            <Tabs.TabPane key={groupKey} tab={groupKey}>
              {searchStatus === SearchStatus.Invalid ? null : (
                <AssetList
                  assets={assetList}
                  onSelected={onSelected}
                  balanceCaculator={balanceCaculator}
                  disabledKeys={disabledKeys}
                  filterValue={searchValue}
                  renderKey={(asset) => props.renderKey(asset, assets.indexOf(asset), groupedAssets)}
                />
              )}
              <SearchMeta status={searchStatus} chainType={currentTab} />
            </Tabs.TabPane>
          );
        })}
      </Tabs>
    </Container>
  );
}
