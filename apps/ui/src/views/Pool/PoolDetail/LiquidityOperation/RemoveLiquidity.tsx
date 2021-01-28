import { ArrowDownOutlined } from '@ant-design/icons';
import { LiquidityInfo } from '@gliaswap/commons';
import { Button, Col, Row, Slider, Typography } from 'antd';
import { AssetBalanceList, AssetBaseQuotePrices, PoolAssetSymbol } from 'components/Asset';
import { HumanizeBalance } from 'components/Balance';
import { Section, SpaceBetweenRow } from 'components/Layout';
import { useRemoveLiquidity } from 'hooks/useRemoveLiquidity';
import i18n from 'i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';
import { BN } from 'suite';
import { TransactionFeeLabel } from 'views/Pool/PoolDetail/LiquidityOperation/components/TransactionFeeLabel';
import { OperationConfirmModal } from 'views/Pool/PoolDetail/LiquidityOperation/OperationConfirmModal';
import { RequestFeeLabel } from './components/RequestFeeLabel';

const { Text } = Typography;

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
  const [confirming, setConfirming] = useState(false);
  const {
    generateRemoveLiquidityTransaction,
    readyToRemoveShare,
    readyToSendTransactionWithFee,
    setReadyToRemoveShare,
    readyToReceiveAssets,
    readyToRemoveLpToken,
  } = useRemoveLiquidity();

  const removePercent = useMemo(() => BN(readyToRemoveShare).times(100).toNumber(), [readyToRemoveShare]);

  function setRemovePercent(percent: number) {
    setReadyToRemoveShare(BN(percent).div(100).toNumber());
  }

  const { isLoading: isGeneratingTransaction, mutate: generateTransaction, status } = useMutation(
    ['generateRemoveLiquidityTransaction'],
    () => generateRemoveLiquidityTransaction(),
    {},
  );

  useEffect(() => {
    if (status === 'success') setConfirming(true);
  }, [status]);

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
        <ReceiveAssets assets={readyToReceiveAssets} />
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
      <Button
        block
        type="primary"
        disabled={!readyToRemoveShare}
        onClick={() => generateTransaction()}
        loading={isGeneratingTransaction}
      >
        {i18n.t('Remove Liquidity')}
      </Button>

      <OperationConfirmModal
        visible={confirming}
        onOk={() => Promise.resolve()}
        onCancel={() => setConfirming(false)}
        operation={<Text strong>{i18n.t('Remove Liquidity')}</Text>}
      >
        {readyToSendTransactionWithFee && (
          <>
            <div className="label">{i18n.t('Remove')}</div>
            <SpaceBetweenRow style={{ fontWeight: 'bold', fontSize: '14px' }}>
              <div>
                <HumanizeBalance asset={readyToRemoveLpToken} />
              </div>
              <div>
                <PoolAssetSymbol assets={readyToReceiveAssets} />
              </div>
            </SpaceBetweenRow>

            <ArrowDownOutlined style={{ margin: '16px' }} />

            <div className="label">{i18n.t('Receive(EST)')}</div>
            <AssetBalanceList assets={readyToReceiveAssets} style={{ fontWeight: 'bold' }} />

            <SpaceBetweenRow>
              <TransactionFeeLabel />
              <HumanizeBalance
                asset={{ symbol: 'CKB', decimals: 8 }}
                value={readyToSendTransactionWithFee.fee}
                maxToFormat={8}
                showSuffix
              />
            </SpaceBetweenRow>
          </>
        )}
      </OperationConfirmModal>
    </RemoveLiquidityWrapper>
  );
};
