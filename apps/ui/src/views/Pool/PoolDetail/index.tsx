import React from 'react';
import { useParams } from 'react-router-dom';
import { LiquidityInfo } from './LiquidityInfo';
import { LiquidityOperation } from './LiquidityOperation';
import { LiquidityOperationList } from 'views/Pool/PoolDetail/LiquidityOperationList';

export const PoolDetail: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  return (
    <>
      <LiquidityInfo poolId={poolId} />
      <LiquidityOperation poolId={poolId} />
      <LiquidityOperationList poolId={poolId} />
    </>
  );
};
