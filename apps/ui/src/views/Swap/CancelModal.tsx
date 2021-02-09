import { LoadingOutlined } from '@ant-design/icons';
import { GliaswapAssetWithBalance, isShadowEthAsset, SwapOrderType } from '@gliaswap/commons';
import { Builder, Transaction } from '@lay2/pw-core';
import { Form, message } from 'antd';
import { ReactComponent as DownArrowSvg } from 'assets/svg/down-arrow.svg';
import { AssetSymbol } from 'components/Asset';
import { ConfirmButton } from 'components/ConfirmButton';
import { MetaContainer } from 'components/MetaContainer';
import { ModalContainer } from 'components/ModalContainer';
import { TableRow } from 'components/TableRow';
import { DeclineResult, SuccessResult, TransactionStatus } from 'components/TransactionResult';
import { useGliaswap } from 'hooks';
import { usePendingCancelOrders } from 'hooks/usePendingCancelOrders';
import i18n from 'i18n';
import React, { useCallback, useMemo, useState } from 'react';
import { Trans } from 'react-i18next';
import { useQuery, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { displayBalance } from 'utils';
import { useSwapContainer } from './context';

export const Container = styled(ModalContainer)`
  .cancel {
    color: #f35252;
  }

  .hidden {
    visibility: hidden;
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
  const { cancelModalVisable, setCancelModalVisable, currentOrder } = useSwapContainer();
  const tokenA = currentOrder?.amountIn!;
  const tokenB = currentOrder?.amountOut!;

  const orderType = currentOrder?.type;

  const [isSending, setIsSending] = useState(false);
  const { api, currentUserLock, currentEthAddress, assertsConnectedAdapter } = useGliaswap();

  const isCrossChainOrder = useMemo(() => {
    return orderType === SwapOrderType.CrossChainOrder;
  }, [orderType]);

  const payAsset = useMemo(() => {
    if (isCrossChainOrder && isShadowEthAsset(tokenA!)) {
      return {
        ...tokenA.shadowFrom,
        balance: tokenA.balance,
      };
    }
    return tokenA;
  }, [isCrossChainOrder, tokenA]);

  const [cancelTx, setCancelTx] = useState<Transaction | null>(null);
  const [transactionStatus, setTransactionStatus] = useState(TransactionStatus.Normal);

  const { isFetching } = useQuery(
    ['cancel-order', cancelModalVisable, currentOrder?.transactionHash, currentUserLock, isSending, transactionStatus],
    async () => {
      const { tx } = await api.cancelSwapOrders(currentOrder?.transactionHash!, currentUserLock!);
      return tx;
    },
    {
      enabled:
        cancelModalVisable &&
        !!currentUserLock &&
        !!currentOrder?.transactionHash &&
        isSending === false &&
        transactionStatus === TransactionStatus.Normal,
      onSuccess(tx) {
        setCancelTx(tx);
      },
      onError(error: Error) {
        setErrorMessage(error?.message);
        setTransactionStatus(TransactionStatus.Decline);
      },
      retry: 1,
    },
  );

  const [, addPendingCancelOrder] = usePendingCancelOrders();
  const queryClient = useQueryClient();
  const [cancelTxhash, setCancelTxhash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const cancelOrder = useCallback(async () => {
    const adapter = assertsConnectedAdapter();
    setIsSending(true);
    try {
      const txhash = await adapter.signer.sendTransaction(cancelTx!);
      try {
        await queryClient.refetchQueries(['swap-list', currentUserLock, currentEthAddress]);
      } catch (error) {
        //
      }
      setTransactionStatus(TransactionStatus.Success);
      setCancelTxhash(txhash);
      addPendingCancelOrder(currentOrder?.transactionHash!);
    } catch (error) {
      setErrorMessage(error.message);
      setTransactionStatus(TransactionStatus.Decline);
    } finally {
      setIsSending(false);
      setCancelTx(null);
    }
  }, [
    assertsConnectedAdapter,
    cancelTx,
    addPendingCancelOrder,
    currentOrder?.transactionHash,
    queryClient,
    currentEthAddress,
    currentUserLock,
  ]);

  const txFee = useMemo(() => {
    if (isFetching) {
      return <LoadingOutlined />;
    }
    const fee = cancelTx ? Builder.calcFee(cancelTx).toString() : '0';
    return `${fee} CKB`;
  }, [cancelTx, isFetching]);

  const onCancel = useCallback(() => {
    if (isSending) {
      message.warn({ content: i18n.t('validation.confirming') });
      return;
    }
    setCancelModalVisable(false);
    setTransactionStatus(TransactionStatus.Normal);
  }, [setCancelModalVisable, isSending]);

  return (
    <Container
      title={i18n.t('swap.cancel-modal.review')}
      footer={null}
      visible={cancelModalVisable}
      onCancel={onCancel}
      width="360px"
      maskClosable={!isSending}
      keyboard={!isSending}
    >
      {transactionStatus === TransactionStatus.Success ? (
        <SuccessResult txHash={cancelTxhash} onDismiss={onCancel} isEth={false} />
      ) : null}
      {transactionStatus === TransactionStatus.Decline ? (
        <DeclineResult onDismiss={onCancel} errMessage={errorMessage} />
      ) : null}
      {transactionStatus === TransactionStatus.Normal ? (
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
                    values={{ amount: displayBalance(tokenA), tokenName: tokenA?.symbol }}
                    components={{ bold: <strong /> }}
                  />
                ) : null}
              </MetaContainer>
            </Form.Item>
          ) : null}
          <TableRow label={i18n.t('swap.cancel-modal.tx-fee')} value={txFee} />
          <Form.Item className="submit">
            <ConfirmButton
              loading={isSending || isFetching}
              onClick={cancelOrder}
              text={i18n.t('swap.cancel-modal.cancel')}
              bgColor="#F35252"
            />
          </Form.Item>
        </Form>
      ) : null}
    </Container>
  );
};
