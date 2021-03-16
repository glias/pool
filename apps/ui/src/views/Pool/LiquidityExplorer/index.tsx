import { CkbAsset, CkbModel, LiquidityPoolFilter } from '@gliaswap/commons';
import { Button, Divider, Radio, Row, Skeleton } from 'antd';
import { useGliaswap } from 'hooks';
import i18n from 'i18n';
import { differenceWith } from 'lodash';
import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AssetFilter } from './AssetFilter';
import { LiquidityList } from './LiquidityList';

const LiquidityExplorerWrapper = styled.div``;

const LiquidityExplorer = () => {
  const { pathname } = useLocation();
  const { api, currentUserLock } = useGliaswap();
  const history = useHistory();
  const [specsFilter, setSpecsFilter] = useState<CkbAsset[]>([]);

  const currentTab = useMemo<'mine' | 'all'>(() => {
    return pathname === '/pool/explorer/mine' ? 'mine' : 'all';
  }, [pathname]);

  const poolFilter = useMemo<LiquidityPoolFilter>(() => {
    const lock = pathname !== '/pool/explorer/mine' ? undefined : currentUserLock;
    return { lock, assets: specsFilter };
  }, [pathname, currentUserLock, specsFilter]);

  const { data, status } = useQuery(['getLiquidityPools', poolFilter], async () => {
    const pools = await api.getLiquidityPools(poolFilter);
    return pools.filter((pool) => differenceWith(specsFilter, pool.assets, CkbModel.equals).length === 0);
  });

  return (
    <LiquidityExplorerWrapper>
      <header style={{ textAlign: 'center' }}>
        <Radio.Group
          buttonStyle="solid"
          size="large"
          value={currentTab}
          onChange={(e) =>
            e.target.value === 'mine' ? history.push('/pool/explorer/mine') : history.push('/pool/explorer')
          }
          optionType="button"
          options={[
            { label: i18n.t('My Liquidity'), value: 'mine', disabled: !currentUserLock },
            { label: i18n.t('Explore Pool'), value: 'all' },
          ]}
        />
      </header>
      <Row justify="space-between" align="middle" style={{ paddingTop: '32px' }}>
        <Button type="primary" disabled={!currentUserLock}>
          <Link to="/pool/create">{i18n.t('Create Pool')}</Link>
        </Button>
        <AssetFilter onChange={setSpecsFilter} />
      </Row>
      <Divider />
      {status === 'loading' || !data ? <Skeleton /> : <LiquidityList pools={data} />}
    </LiquidityExplorerWrapper>
  );
};

export default LiquidityExplorer;
