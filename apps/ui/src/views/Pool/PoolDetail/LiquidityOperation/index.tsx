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
  const { poolLiquidityQuery, lockLiquidityQuery } = useLiquidityQuery(props.poolId);
  const { data: poolLiquidity } = poolLiquidityQuery;
  const { data: lockLiquidity } = lockLiquidityQuery;

  if (!poolLiquidity) return null;

  return (
    <LiquidityOperationWrapper>
      <Tabs size="small">
        <Tabs.TabPane key="add" tab={i18n.t('Add Liquidity')}>
          <AddLiquidity poolLiquidity={poolLiquidity} />
        </Tabs.TabPane>
        <Tabs.TabPane disabled={!lockLiquidity} key="remove" tab={i18n.t('Remove Liquidity')}>
          {lockLiquidity && poolLiquidity && (
            <RemoveLiquidity lockLiquidity={lockLiquidity} poolLiquidity={poolLiquidity} />
          )}
        </Tabs.TabPane>
      </Tabs>
    </LiquidityOperationWrapper>
  );
};
