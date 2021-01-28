import { ArrowDownOutlined } from '@ant-design/icons';
import { LiquidityInfo } from '@gliaswap/commons';
import { Button, Col, Row, Slider } from 'antd';
import BigNumber from 'bignumber.js';
import { AssetBalanceList, AssetBaseQuotePrices } from 'components/Asset';
import { Section, SpaceBetweenRow } from 'components/Layout';
import i18n from 'i18n';
import update from 'immutability-helper';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { RequestFeeLabel } from './components/RequestFeeLabel';

interface RemoveLiquidityProps {
  poolLiquidity: LiquidityInfo;
  userLiquidity: LiquidityInfo;
}

const RemoveLiquidityWrapper = styled.div`
  .bold {
    font-weight: bold;
    font-size: 18px;
  }

  .amount {
    font-size: 18px;
  }

  .arrow-icon {
    display: block;
    margin: 16px auto;
  }

  .button-percent {
    border-radius: 0;

    &--selected {
      background: #000;
      color: #fff;
    }
  }
`;

const ReceiveAssets = styled(AssetBalanceList)`
  font-size: 18px;
  font-weight: bold;
`;

export const RemoveLiquidity: React.FC<RemoveLiquidityProps> = (props) => {
  const [removePercent, setRemovePercent] = useState(0); /* 0 - 100 */
  const userLiquidity = props.userLiquidity;

  const assetsWithRemoveLiquidityBalance = useMemo(
    () =>
      userLiquidity.assets.map((asset) =>
        update(asset, { balance: (balance) => new BigNumber(balance).times(removePercent / 100).toString() }),
      ),
    [userLiquidity.assets, removePercent],
  );

  const RemovePercentButton: React.FC<{ value: number; display?: string }> = ({ display, value }) => {
    return (
      <Col span={6}>
        <Button
          size="small"
          block
          className={`button-percent ${value === removePercent ? 'button-percent--selected' : ''}`}
          onClick={() => setRemovePercent(value)}
        >
          {display ?? value + '%'}
        </Button>
      </Col>
    );
  };

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
        <Row gutter={4}>
          <RemovePercentButton value={25} />
          <RemovePercentButton value={50} />
          <RemovePercentButton value={75} />
          <RemovePercentButton value={100} display="Max" />
        </Row>
      </Section>
      <ArrowDownOutlined className="arrow-icon" />
      <Section bordered>
        <h4>{i18n.t('Receive(EST)')}</h4>
        <ReceiveAssets assets={assetsWithRemoveLiquidityBalance} />
      </Section>

      <SpaceBetweenRow>
        <div className="label">Price</div>
        <div>
          <AssetBaseQuotePrices
            assets={props.poolLiquidity.assets}
            prices={props.poolLiquidity.assets.map((asset) => asset.balance)}
          />
        </div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">
          <RequestFeeLabel />
        </div>
        <div>
          <b>{i18n.t('Free now')}</b>
        </div>
      </SpaceBetweenRow>
      <Button block type="primary">
        {i18n.t('Remove Liquidity')}
      </Button>
    </RemoveLiquidityWrapper>
  );
};
