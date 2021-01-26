import { LiquidityPoolFilter } from '@gliaswap/commons';
import { Radio, Skeleton } from 'antd';
import { useGliaswap } from 'hooks';
import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { LiquidityList } from './LiquidityList';

const LiquidityExplorerWrapper = styled.div``;

const LiquidityExplorer = () => {
  const { pathname } = useLocation();
  const { api, currentUserLock } = useGliaswap();
  const history = useHistory();

  const poolFilter = useMemo<LiquidityPoolFilter | undefined>(() => {
    if (pathname !== '/pool/explorer/mine') return undefined;
    return { lock: currentUserLock };
  }, [pathname, currentUserLock]);

  const { data, status } = useQuery(['getLiquidityPools', api, poolFilter], () => api.getLiquidityPools(poolFilter));

  return (
    <LiquidityExplorerWrapper>
      <header style={{ textAlign: 'center' }}>
        <Radio.Group
          buttonStyle="solid"
          size="large"
          value={poolFilter ? 'mine' : 'all'}
          onChange={(e) =>
            e.target.value === 'mine' ? history.push('/pool/explorer/mine') : history.push('/pool/explorer')
          }
          optionType="button"
          options={[
            { label: 'My Liquidity', value: 'mine' },
            { label: 'Explore Pool', value: 'all' },
          ]}
        />
      </header>
      {status === 'loading' || !data ? <Skeleton /> : <LiquidityList pools={data} />}
    </LiquidityExplorerWrapper>
  );
};

export default LiquidityExplorer;
