import { useGliaswap } from 'hooks';
import { useState, useEffect } from 'react';
import { useQuery, UseQueryOptions } from 'react-query';
import { PoolInfo } from '@gliaswap/commons';

export interface PoolInfoWithTimestamp {
  lastUpdated: string;
  value: PoolInfo[];
}

export function useLiquidityPoolInfo(queryOptions?: UseQueryOptions<PoolInfo[], unknown, PoolInfo[]>) {
  const [poolInfo, setPoolInfo] = useState<PoolInfoWithTimestamp>({ lastUpdated: `${Date.now()}`, value: [] });
  const [isLoadingPoolInfo, setIsLoadingPollInfo] = useState(false);
  const { api } = useGliaswap();

  const { data, status } = useQuery(['getLiquidityPools', api], () => api.getLiquidityPools(), queryOptions);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoadingPollInfo(true);
    }
    if (data) {
      setPoolInfo({
        lastUpdated: `${Date.now()}`,
        value: data,
      });
    }
  }, [data, status]);

  return {
    poolInfo,
    isLoadingPoolInfo,
    status,
  };
}
