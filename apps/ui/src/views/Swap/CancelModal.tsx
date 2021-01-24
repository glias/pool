import { GliaswapAssetWithBalance, isShadowAsset, SwapOrderType } from '@gliaswap/commons';
import { Builder } from '@lay2/pw-core';
import { Form } from 'antd';
import { AssetSymbol } from 'components/Asset';
import { ConfirmButton } from 'components/ConfirmButton';
import { ModalContainer } from 'components/ModalContainer';
import { TableRow } from 'components/TableRow';
import i18n from 'i18n';
import React from 'react';
import { useMemo } from 'react';
import styled from 'styled-components';
import { displayBalance } from 'utils';
import { useSwapContainer } from './hook';
import { ReactComponent as DownArrowSvg } from 'asserts/svg/down-arrow.svg';
import { MetaContainer } from 'components/MetaContainer';
import { Trans } from 'react-i18next';

const Container = styled(ModalContainer)`
  .cancel {
    color: #f35252;
  }
  .ant-form-item {
    margin-bottom: 16px;
    .ant-form-item-label {
      padding: 0;
      label {
        font-size: 14px;
        line-height: 22px;
        color: #7e7e7e;
      }
    }
    .ant-form-item-control-input {
      line-height: 22px;
      min-height: 0;
    }

    &:last-child {
      margin-top: 16px;
      margin-bottom: 0;
    }
  }
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  .amount {
    font-weight: bold;
    font-size: 14px;
    line-height: 22px;
    color: rgba(0, 0, 0, 0.85);
    align-items: flex-start;
    flex: 1;
  }
  .asset {
    font-weight: bold;
    font-size: 14px;
    line-height: 22px;
    color: rgba(0, 0, 0, 0.85);
    align-items: flex-end;
  }
`;

export const AssetRow = ({ asset }: { asset: GliaswapAssetWithBalance }) => {
  return (
    <Row>
      <span className="amount">{displayBalance(asset)}</span>
      <span className="asset">
        <AssetSymbol asset={asset} />
      </span>
    </Row>
  );
};

export const CancelModal = () => {
  const { cancelModalVisable, currentCkbTx, currentOrder, setCancelModalVisable } = useSwapContainer();
  const txFee = useMemo(() => {
    const fee = currentCkbTx ? Builder.calcFee(currentCkbTx).toString() : '0';
    return `${fee} CKB`;
  }, [currentCkbTx]);

  const tokenA = currentOrder?.amountIn!;
  const tokenB = currentOrder?.amountOut!;

  const orderType = currentOrder?.type;

  const isCrossChainOrder = useMemo(() => {
    return orderType === SwapOrderType.CrossChainOrder;
  }, [orderType]);

  const payAsset = useMemo(() => {
    if (isCrossChainOrder && isShadowAsset(tokenA!)) {
      return {
        ...tokenA.shadowFrom,
        balance: tokenA.balance,
      };
    }
    return tokenA;
  }, [isCrossChainOrder, tokenA]);

  return (
    <Container
      title={i18n.t('swap.cancel-modal.review')}
      footer={null}
      visible={cancelModalVisable}
      onCancel={() => setCancelModalVisable(false)}
      width="360px"
    >
      <Form layout="vertical">
        <Form.Item label={i18n.t('swap.cancel-modal.operation')}>
          <span className="cancel">{i18n.t('swap.cancel-modal.cancel-swap')}</span>
        </Form.Item>
        <Form.Item label={i18n.t('swap.cancel-modal.pay')}>
          <AssetRow asset={payAsset} />
        </Form.Item>
        <Form.Item>
          <DownArrowSvg />
        </Form.Item>
        {isCrossChainOrder ? (
          <>
            <Form.Item label={i18n.t('swap.cancel-modal.cross-chain')}>
              <AssetRow asset={tokenA} />
            </Form.Item>
            <Form.Item>
              <DownArrowSvg />
            </Form.Item>
          </>
        ) : null}
        <Form.Item label={i18n.t('swap.cancel-modal.receive')}>
          <AssetRow asset={tokenB} />
        </Form.Item>
        {isCrossChainOrder ? (
          <Form.Item>
            <MetaContainer>
              {currentOrder ? (
                <Trans
                  defaults="You will get <bold>{{amount}} {{tokenName}}</bold> back to your available balance." // optional defaultValue
                  values={{ amount: displayBalance(tokenA), tokenName: tokenA?.name }}
                  components={{ bold: <strong /> }}
                />
              ) : null}
            </MetaContainer>
          </Form.Item>
        ) : null}
        <TableRow
          label={i18n.t('swap.cancel-modal.tx-fee')}
          labelTooltip={i18n.t('swap.cancel-modal.tx-fee-desc')}
          value={txFee}
        />
        <Form.Item className="submit">
          <ConfirmButton text={i18n.t('swap.cancel-modal.cancel')} bgColor="#F35252" />
        </Form.Item>
      </Form>
    </Container>
  );
};
