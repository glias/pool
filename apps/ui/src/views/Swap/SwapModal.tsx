import { isEthAsset } from '@gliaswap/commons';
import { Builder } from '@lay2/pw-core';
import { Form } from 'antd';
import { ConfirmButton } from 'components/ConfirmButton';
import { TableRow } from 'components/TableRow';
import i18n from 'i18n';
import React from 'react';
import { useMemo } from 'react';
import { SwapMode, useSwapContainer } from './context';
import { ReactComponent as DownArrowSvg } from 'assets/svg/down-arrow.svg';
import { MetaContainer } from 'components/MetaContainer';
import { Trans } from 'react-i18next';
import { Container, AssetRow } from './CancelModal';
import { CrossMeta } from './CrossMeta';
import { SWAP_CELL_ASK_CAPACITY } from 'suite/constants';

export const SwapModal = () => {
  const { reviewModalVisable, currentCkbTx, setReviewModalVisable, tokenA, tokenB, swapMode } = useSwapContainer();
  const txFee = useMemo(() => {
    const fee = currentCkbTx ? Builder.calcFee(currentCkbTx).toString() : '0';
    return `${fee} CKB`;
  }, [currentCkbTx]);

  const isCrossChainOrder = useMemo(() => {
    return swapMode === SwapMode.CrossChainOrder;
  }, [swapMode]);

  const isNormalOrder = useMemo(() => {
    return swapMode === SwapMode.NormalOrder;
  }, [swapMode]);

  const shadowAsset = useMemo(() => {
    if (isCrossChainOrder && isEthAsset(tokenA!)) {
      return {
        ...tokenA,
        symbol: `ck${tokenA.symbol}`,
      };
    }
    return tokenA!;
  }, [isCrossChainOrder, tokenA]);

  const operation = useMemo(() => {
    switch (swapMode) {
      case SwapMode.CrossIn:
      case SwapMode.CrossOut:
        return 'crosschain';
      case SwapMode.CrossChainOrder:
        return 'crosschain order';
      default:
        return 'order';
    }
  }, [swapMode]);

  return (
    <Container
      title={i18n.t('swap.cancel-modal.review')}
      footer={null}
      visible={reviewModalVisable}
      onCancel={() => setReviewModalVisable(false)}
      width="360px"
    >
      <Form layout="vertical">
        <Form.Item label={i18n.t('swap.cancel-modal.operation')}>
          <span>
            {i18n.t('swap.swap-modal.swap')}
            {`(${operation})`}
          </span>
        </Form.Item>
        <Form.Item label={i18n.t('swap.cancel-modal.pay')}>
          <AssetRow asset={tokenA!} />
        </Form.Item>
        <Form.Item>
          <DownArrowSvg />
        </Form.Item>
        {isCrossChainOrder ? (
          <>
            <Form.Item label={i18n.t('swap.cancel-modal.cross-chain')}>
              <AssetRow asset={shadowAsset!} />
            </Form.Item>
            <Form.Item>
              <DownArrowSvg />
            </Form.Item>
          </>
        ) : null}
        <Form.Item label={i18n.t('swap.cancel-modal.receive')}>
          <AssetRow asset={tokenB!} />
        </Form.Item>
        <Form.Item>
          {isNormalOrder ? (
            <MetaContainer>
              {tokenA ? (
                <Trans
                  defaults="Your <bold>{{amount}} CKB</bold> will be temporarily locked and will be automatically unlocked once trading successfully."
                  values={{ amount: SWAP_CELL_ASK_CAPACITY }}
                  components={{ bold: <strong /> }}
                />
              ) : null}
            </MetaContainer>
          ) : (
            <CrossMeta isBid={false} pureCross={swapMode === SwapMode.CrossOut} />
          )}
        </Form.Item>
        {currentCkbTx ? (
          <TableRow
            label={i18n.t('swap.cancel-modal.tx-fee')}
            labelTooltip={i18n.t('swap.cancel-modal.tx-fee-desc')}
            value={txFee}
          />
        ) : null}
        <Form.Item className="submit">
          <ConfirmButton text={i18n.t('swap.swap-modal.confirm')} />
        </Form.Item>
      </Form>
    </Container>
  );
};
