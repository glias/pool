import React from 'react';
import { useParams } from 'react-router-dom';
import { LiquidityOperationList } from 'views/Pool/PoolDetail/LiquidityOperationList';
import { LiquidityInfo } from './LiquidityInfo';
import { LiquidityOperation } from './LiquidityOperation';

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
