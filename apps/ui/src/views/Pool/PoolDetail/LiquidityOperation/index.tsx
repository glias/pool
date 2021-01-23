import { Tabs } from 'antd';
import { Section } from 'components/Layout';
import { useQueryLiquidityInfo, useQueryLiquidityWithShare } from 'hooks/useQueryLiquidity';
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
  const { data: poolLiquidity } = useQueryLiquidityInfo(props.poolId);
  const { data: lockLiquidity } = useQueryLiquidityWithShare(props.poolId);

  return (
    <LiquidityOperationWrapper>
      <Tabs size="small">
        <Tabs.TabPane key="add" tab={i18n.t('Add Liquidity')}>
          {poolLiquidity && <AddLiquidity poolLiquidity={poolLiquidity} />}
        </Tabs.TabPane>
        <Tabs.TabPane key="remove" tab={i18n.t('Remove Liquidity')}>
          {lockLiquidity && poolLiquidity && (
            <RemoveLiquidity lockLiquidity={lockLiquidity} poolLiquidity={poolLiquidity} />
          )}
        </Tabs.TabPane>
      </Tabs>
    </LiquidityOperationWrapper>
  );
};
