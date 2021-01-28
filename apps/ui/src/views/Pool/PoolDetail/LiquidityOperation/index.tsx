import { Tabs } from 'antd';
import { Section } from 'components/Layout';
import { useLiquidityQuery } from 'hooks/useLiquidityQuery';
import i18n from 'i18n';
import React from 'react';
import styled from 'styled-components';
import { AddLiquidity } from './AddLiquidity';
import { RemoveLiquidity } from './RemoveLiquidity';

const LiquidityOperationWrapper = styled(Section)``;

export interface LiquidityOperationProps {
  poolId: string;
}

export const LiquidityOperation: React.FC<LiquidityOperationProps> = (props) => {
  const { poolLiquidityQuery, userLiquidityQuery } = useLiquidityQuery(props.poolId);
  const { data: poolLiquidity } = poolLiquidityQuery;
  const { data: userLiquidity } = userLiquidityQuery;

  if (!poolLiquidity) return null;

  return (
    <LiquidityOperationWrapper>
      <Tabs size="small">
        <Tabs.TabPane key="add" tab={i18n.t('Add Liquidity')}>
          <AddLiquidity poolLiquidity={poolLiquidity} />
        </Tabs.TabPane>
        <Tabs.TabPane disabled={!userLiquidity} key="remove" tab={i18n.t('Remove Liquidity')}>
          {userLiquidity && poolLiquidity && (
            <RemoveLiquidity userLiquidity={userLiquidity} poolLiquidity={poolLiquidity} />
          )}
        </Tabs.TabPane>
      </Tabs>
    </LiquidityOperationWrapper>
  );
};
