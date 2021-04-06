import { Tabs } from 'antd';
import { Section } from 'components/Layout';
import { useLiquidityDetail } from 'hooks/useLiquidityDetail';
import i18n from 'i18n';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Amount } from 'suite';
import { AddLiquidity } from './AddLiquidity';
import { RemoveLiquidity } from './RemoveLiquidity';

const LiquidityOperationWrapper = styled(Section)``;

export interface LiquidityOperationProps {
  poolId: string;
}

export const LiquidityOperation: React.FC<LiquidityOperationProps> = (props) => {
  const { poolLiquidityQuery, userLiquidityQuery } = useLiquidityDetail(props.poolId);
  const { data: poolLiquidity } = poolLiquidityQuery;
  const { data: userLiquidity } = userLiquidityQuery;
  const [activeKey, setActiveKey] = useState('add');

  function switchToAddLiquidityWhenNoLiquidity() {
    if (activeKey !== 'remove') return;

    if (!userLiquidity || Amount.fromAsset(userLiquidity.lpToken).value.eq(0) /* no lp token */) {
      setActiveKey('add');
    }
  }

  useEffect(switchToAddLiquidityWhenNoLiquidity, [userLiquidity, activeKey]);

  if (!poolLiquidity) return null;

  return (
    <LiquidityOperationWrapper>
      <Tabs onChange={setActiveKey} activeKey={activeKey} size="small" centered tabBarGutter={16}>
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
