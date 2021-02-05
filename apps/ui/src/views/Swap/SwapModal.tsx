import { isEthAsset, buildPendingSwapOrder, SwapOrderType } from '@gliaswap/commons';
import { Builder } from '@lay2/pw-core';
import { Form, message } from 'antd';
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
import { SWAP_CELL_ASK_CAPACITY, SWAP_CELL_BID_CAPACITY } from 'suite/constants';
import { useGliaswap, useGliaswapAssets } from 'hooks';
import { useQueryClient } from 'react-query';
import { DeclineResult, SuccessResult, TransactionStatus } from 'components/TransactionResult';
import { docsFaq } from 'envs';

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
    resetForm,
    isBid,
  } = useSwapContainer();
  const { adapter, currentUserLock, currentEthAddress } = useGliaswap();
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
      const shadowAsset =
        swapMode === SwapMode.CrossChainOrder
          ? shadowEthAssets.find((a) => isEthAsset(tokenA) && a.shadowFrom.address === tokenA.address)
          : null;
      const pendingOrder = buildPendingSwapOrder(
        shadowAsset ? { ...shadowAsset, balance: tokenA.balance } : tokenA,
        tokenB,
        txHash,
        shadowAsset ? SwapOrderType.CrossChainOrder : SwapOrderType.CrossChain,
      );
      setAndCacheCrossChainOrders((orders) => [pendingOrder, ...orders]);
      return txHash;
    }
  }, [currentEthTx, sendEthTransaction, tokenA, tokenB, setAndCacheCrossChainOrders, swapMode, shadowEthAssets]);

  const placeCrossOut = useCallback(async () => {
    if (currentCkbTx) {
      const txHash = await adapter.raw.pw.sendTransaction(currentCkbTx);
      const pendingOrder = buildPendingSwapOrder(tokenA, tokenB, txHash, SwapOrderType.CrossChain);
      setAndCacheCrossChainOrders((orders) => [pendingOrder, ...orders]);
      return txHash;
    }
  }, [currentCkbTx, adapter.raw.pw, tokenA, tokenB, setAndCacheCrossChainOrders]);

  const placeNormalorder = useCallback(async () => {
    if (currentCkbTx) {
      const txHash = await adapter.raw.pw.sendTransaction(currentCkbTx);
      return txHash;
    }
  }, [currentCkbTx, adapter.raw.pw]);

  const queryClient = useQueryClient();

  const [transactionStatus, setTransactionStatus] = useState(TransactionStatus.Normal);
  const [swapTxhash, setSwapTxhash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const placeOrder = useCallback(async () => {
    setIsPlacingOrder(true);
    try {
      let txhash: string | undefined = '';
      switch (swapMode) {
        case SwapMode.CrossChainOrder:
        case SwapMode.CrossIn:
          txhash = await placeLockOrder();
          break;
        case SwapMode.CrossOut:
          txhash = await placeCrossOut();
          break;
        case SwapMode.NormalOrder:
          txhash = await placeNormalorder();
          break;
        default:
          break;
      }
      if (txhash) {
        setSwapTxhash(txhash);
      }
      resetForm();
      setTransactionStatus(TransactionStatus.Success);
    } catch (error) {
      setErrorMessage(error.message);
      setTransactionStatus(TransactionStatus.Decline);
    }

    try {
      await queryClient.refetchQueries(['swap-list', currentUserLock, currentEthAddress]);
    } finally {
      setIsPlacingOrder(false);
    }
  }, [
    swapMode,
    placeLockOrder,
    placeCrossOut,
    placeNormalorder,
    resetForm,
    queryClient,
    currentEthAddress,
    currentUserLock,
  ]);

  const onCancel = useCallback(() => {
    if (isPlacingOrder) {
      message.warn({ content: i18n.t('validation.confirming') });
      return;
    }
    setReviewModalVisable(false);
    setTransactionStatus(TransactionStatus.Normal);
  }, [setReviewModalVisable, isPlacingOrder]);

  return (
    <Container
      title={i18n.t('swap.cancel-modal.review')}
      footer={null}
      visible={reviewModalVisable}
      onCancel={onCancel}
      width="360px"
      maskClosable={!isPlacingOrder}
      keyboard={!isPlacingOrder}
    >
      {transactionStatus === TransactionStatus.Success ? (
        <SuccessResult txHash={swapTxhash} onDismiss={onCancel} isEth={swapMode !== SwapMode.NormalOrder} />
      ) : null}
      {transactionStatus === TransactionStatus.Decline ? (
        <DeclineResult onDismiss={onCancel} errMessage={errorMessage} />
      ) : null}
      {transactionStatus === TransactionStatus.Normal ? (
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
          {isNormalOrder ? (
            tokenA ? (
              <Form.Item>
                <MetaContainer>
                  <Trans
                    defaults="Your <bold>{{amount}} CKB</bold> will be temporarily locked and will be automatically unlocked once trading successfully."
                    values={{ amount: isBid ? SWAP_CELL_BID_CAPACITY : SWAP_CELL_ASK_CAPACITY }}
                    components={{ bold: <strong /> }}
                  />
                  <a
                    href={docsFaq('why-lock-my-addtional-ckb-when-i-make-a-swap')}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {i18n.t('swap.swap-modal.learn-why')}
                  </a>
                </MetaContainer>
              </Form.Item>
            ) : null
          ) : swapMode === SwapMode.CrossOut ? null : (
            <Form.Item>
              <CrossMeta isBid={false} swapMode={swapMode} />
            </Form.Item>
          )}
          {isNormalOrder ? null : (
            <Form.Item>
              <MetaContainer>
                {i18n.t('swap.swap-modal.cross-time', {
                  chain: swapMode === SwapMode.CrossOut ? 'Nervos' : 'Ethereum',
                })}
              </MetaContainer>
            </Form.Item>
          )}
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
      ) : null}
    </Container>
  );
};
