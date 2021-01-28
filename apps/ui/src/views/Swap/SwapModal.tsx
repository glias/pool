import { isEthAsset, buildPendingSwapOrder, SwapOrderType } from '@gliaswap/commons';
import { Builder } from '@lay2/pw-core';
import { Form, Modal } from 'antd';
import { ConfirmButton } from 'components/ConfirmButton';
import { TableRow } from 'components/TableRow';
import i18n from 'i18n';
import React from 'react';
import { useMemo, useState, useCallback } from 'react';
import { SwapMode, useSwapContainer } from './context';
import { ReactComponent as DownArrowSvg } from 'assets/svg/down-arrow.svg';
import { MetaContainer } from 'components/MetaContainer';
import { Trans } from 'react-i18next';
import { Container, AssetRow } from './CancelModal';
import { CrossMeta } from './CrossMeta';
import { SWAP_CELL_ASK_CAPACITY } from 'suite/constants';
import { useGliaswap, useGliaswapAssets } from 'contexts';

export const SwapModal = () => {
  const {
    reviewModalVisable,
    currentCkbTx,
    setReviewModalVisable,
    tokenA,
    tokenB,
    swapMode,
    currentEthTx,
    sendEthTransaction,
    setAndCacheCrossChainOrders,
    isSendCkbTransaction,
  } = useSwapContainer();
  const { adapter } = useGliaswap();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { shadowEthAssets } = useGliaswapAssets();

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
      const asset = shadowEthAssets.find((a) => a.shadowFrom.address === tokenA.address);
      return {
        ...(asset ?? tokenA),
        balance: tokenA.balance,
      };
    }
    return tokenA!;
  }, [isCrossChainOrder, tokenA, shadowEthAssets]);

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

  const placeLockOrder = useCallback(async () => {
    if (currentEthTx) {
      const txHash = await sendEthTransaction(currentEthTx);
      const pendingOrder = buildPendingSwapOrder(tokenA, tokenB, txHash, SwapOrderType.CrossChain);
      setAndCacheCrossChainOrders((orders) => [pendingOrder, ...orders]);
    }
  }, [currentEthTx, sendEthTransaction, tokenA, tokenB, setAndCacheCrossChainOrders]);

  const placeCrossOut = useCallback(async () => {
    if (currentCkbTx) {
      const txHash = await adapter.raw.pw.sendTransaction(currentCkbTx);
      const pendingOrder = buildPendingSwapOrder(tokenA, tokenB, txHash, SwapOrderType.CrossChain);
      setAndCacheCrossChainOrders((orders) => [pendingOrder, ...orders]);
    }
  }, [currentCkbTx, adapter.raw.pw, tokenA, tokenB, setAndCacheCrossChainOrders]);

  const placeNormalorder = useCallback(async () => {
    if (currentCkbTx) {
      await adapter.raw.pw.sendTransaction(currentCkbTx);
    }
  }, [currentCkbTx, adapter.raw.pw]);

  const placeOrder = useCallback(async () => {
    setIsPlacingOrder(true);
    try {
      switch (swapMode) {
        case SwapMode.CrossChainOrder:
        case SwapMode.CrossIn:
          await placeLockOrder();
          break;
        case SwapMode.CrossOut:
          await placeCrossOut();
          break;
        case SwapMode.NormalOrder:
          await placeNormalorder();
          break;
        default:
          break;
      }
      setReviewModalVisable(false);
    } catch (error) {
      Modal.error({
        title: 'Sign Transaction',
        content: error.message,
      });
    } finally {
      setIsPlacingOrder(false);
    }
  }, [swapMode, placeLockOrder, placeCrossOut, setReviewModalVisable, placeNormalorder]);

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
            <CrossMeta isBid={false} swapMode={swapMode} />
          )}
        </Form.Item>
        {currentCkbTx && isSendCkbTransaction ? (
          <TableRow
            label={i18n.t('swap.cancel-modal.tx-fee')}
            labelTooltip={i18n.t('swap.cancel-modal.tx-fee-desc')}
            value={txFee}
          />
        ) : null}
        <Form.Item className="submit">
          <ConfirmButton
            text={i18n.t('swap.swap-modal.confirm')}
            loading={isPlacingOrder}
            disabled={isPlacingOrder}
            onClick={placeOrder}
          />
        </Form.Item>
      </Form>
    </Container>
  );
};
