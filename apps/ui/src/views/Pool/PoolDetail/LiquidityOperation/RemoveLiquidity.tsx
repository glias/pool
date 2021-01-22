import { LiquidityInfo } from '@gliaswap/commons';
import { Button, Col, Slider } from 'antd';
import BigNumber from 'bignumber.js';
import { AssetBalanceList } from 'components/Asset';
import { Section, SpaceBetweenRow } from 'components/Layout';
import i18n from 'i18n';
import update from 'immutability-helper';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { RequestFeeLabel } from './components/RequestFeeLabel';

interface RemoveLiquidityProps {
  poolLiquidity: LiquidityInfo;
  lockLiquidity: LiquidityInfo;
}

const RemoveLiquidityWrapper = styled.div`
  .bold {
    font-weight: bold;
    font-size: 18px;
  }

  .amount {
    font-size: 18px;
  }
`;

const ReceiveAssets = styled(AssetBalanceList)`
  font-size: 18px;
  font-weight: bold;
`;

export const RemoveLiquidity: React.FC<RemoveLiquidityProps> = (props) => {
  const [removePercent, setRemovePercent] = useState(0); /* 0 - 100 */
  const lockLiquidity = props.lockLiquidity;

  const assetsWithRemoveLiquidityBalance = useMemo(
    () =>
      lockLiquidity.assets.map((asset) =>
        update(asset, { balance: (balance) => new BigNumber(balance).times(removePercent / 100).toString() }),
      ),
    [lockLiquidity.assets, removePercent],
  );

  const RemovePercentButton: React.FC<{ value: number; display?: string }> = (removeButtonProps) => (
    <Col span={6}>
      <Button
        block
        type={removePercent === removeButtonProps.value ? 'primary' : 'default'}
        onClick={() => setRemovePercent(removeButtonProps.value)}
      >
        {removeButtonProps.display ?? removeButtonProps.value + '%'}
      </Button>
    </Col>
  );

  return (
    <RemoveLiquidityWrapper>
      <Section bordered>
        <SpaceBetweenRow>
          <h4>{i18n.t('Amount')}</h4>
          <h2>{removePercent}%</h2>
        </SpaceBetweenRow>
        <div>
          <Slider value={removePercent} min={0} max={100} onChange={setRemovePercent} />
        </div>
        <SpaceBetweenRow>
          <RemovePercentButton value={25} />
          <RemovePercentButton value={50} />
          <RemovePercentButton value={75} />
          <RemovePercentButton value={100} display="Max" />
        </SpaceBetweenRow>
      </Section>
      <Section bordered>
        <h4>{i18n.t('Receive')}</h4>
        <ReceiveAssets assets={assetsWithRemoveLiquidityBalance} />
      </Section>

      <SpaceBetweenRow>
        <div className="label">Price</div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">
          <RequestFeeLabel />
        </div>
      </SpaceBetweenRow>
      <Button block type="primary">
        {i18n.t('Remove Liquidity')}
      </Button>
    </RemoveLiquidityWrapper>
  );
};
