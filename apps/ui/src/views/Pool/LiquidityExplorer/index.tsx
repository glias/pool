import { Radio, Skeleton } from 'antd';
import { useGliaswap } from 'contexts';
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

  const poolFilter = useMemo(() => {
    if (pathname !== '/pool/explorer/mine') return undefined;
    return currentUserLock;
  }, [pathname, currentUserLock]);

  const { data, status } = useQuery(['liquidity', api, poolFilter], () => api.getLiquidityPools({ lock: poolFilter }));

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
