import { LiquidityInfo } from '@gliaswap/commons';
import { Button, Col, Row, Slider, Typography } from 'antd';
import { ReactComponent as DownArrowSvg } from 'assets/svg/down-arrow.svg';
import { AssetBalanceList, PoolAssetSymbol } from 'components/Asset';
import { HumanizeBalance } from 'components/Balance';
import { Section, SpaceBetweenRow } from 'components/Layout';
import { PriceUnit } from 'components/PriceUnit';
import { TableRow } from 'components/TableRow';
import { useRemoveLiquidity } from 'hooks/useRemoveLiquidity';
import i18n from 'i18n';
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';
import { BN } from 'suite';
import { OperationConfirmModal } from './OperationConfirmModal';
import { LiquidityPoolTokenTooltip } from './components/LiquidityPoolTokenLabel';
import { TransactionFeeLabel } from './components/TransactionFeeLabel';

const { Text } = Typography;

interface RemoveLiquidityProps {
  poolLiquidity: LiquidityInfo;
  userLiquidity: LiquidityInfo;
}

const RemoveLiquidityWrapper = styled.div`
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
  font-size: 16px;
  font-weight: bold;

  .column-numerical {
    text-align: left;
  }
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
    sendRemoveLiquidityTransaction,
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

  const [tokenA, tokenB] = props.poolLiquidity.assets;

  const price = useMemo(() => {
    return BN(tokenA.balance)
      .div(tokenB.balance)
      .times(10 ** tokenB.decimals)
      .div(10 ** tokenA.decimals)
      .toString();
  }, [tokenA, tokenB]);

  return (
    <RemoveLiquidityWrapper>
      <Section bordered compact>
        <SpaceBetweenRow style={{ padding: '0' }}>
          <div className="label">{i18n.t('Amount')}</div>
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

      <DownArrowSvg className="arrow-icon" />

      <Section bordered>
        <SpaceBetweenRow style={{ padding: '0 0 8px' }}>
          <div className="label" style={{ lineHeight: '1.57' }}>
            {i18n.t('Receive(EST)')}
          </div>
        </SpaceBetweenRow>
        <ReceiveAssets assets={readyToReceiveAssets} />
      </Section>

      <PriceUnit tokenA={tokenA} tokenB={tokenB} price={price} />
      <TableRow label={i18n.t('Request fee')} labelTooltip={i18n.t('This fee goes to deal-miners as the incentives.')}>
        {<b>{i18n.t('Free Now')}</b>}
      </TableRow>
      <Button
        style={{ marginTop: '24px' }}
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
        onOk={() => sendRemoveLiquidityTransaction()}
        onCancel={() => setConfirming(false)}
        operation={<Text strong>{i18n.t('Remove Liquidity')}</Text>}
      >
        {readyToSendTransactionWithFee && (
          <>
            <div className="label">
              <LiquidityPoolTokenTooltip>{i18n.t('Remove')}</LiquidityPoolTokenTooltip>
            </div>
            <SpaceBetweenRow style={{ fontWeight: 'bold', fontSize: '14px' }}>
              <div>
                <HumanizeBalance asset={readyToRemoveLpToken} />
              </div>
              <div>
                <PoolAssetSymbol assets={readyToReceiveAssets} />
              </div>
            </SpaceBetweenRow>

            <DownArrowSvg />

            <div className="label">{i18n.t('Receive(EST.)')}</div>
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
