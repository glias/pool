import { Button } from 'antd';
import { ButtonProps } from 'antd/lib/button';
import { ModalContainer } from 'components/ModalContainer';
import { DeclineResult, SuccessResult } from 'components/TransactionResult';
import i18n from 'i18n';
import React from 'react';
import { useMutation } from 'react-query';
import styled from 'styled-components';

interface LiquidityOperationConfirmProps {
  operation: React.ReactNode;
  confirmText?: React.ReactNode;
  confirmButtonType?: ButtonProps['type'];
  onOk: () => Promise<string>;
  onCancel?: () => void;
  className?: string;
  visible?: boolean;
  onSuccessfulDismiss?: () => void;
  onErrorDismiss?: () => void;
}

const OperationConfirmationWrapper = styled.div`
  .label {
    color: #7e7e7e;
  }

  .confirm-content {
    padding: 16px 0;
  }

  .column-numerical {
    text-align: left;
  }
`;

export const OperationConfirmModal: React.FC<LiquidityOperationConfirmProps> = ({
  operation,
  confirmText,
  className,
  children,
  onOk,
  onCancel,
  visible,
  confirmButtonType = 'primary',
  onErrorDismiss = onCancel,
  onSuccessfulDismiss = onCancel,
}) => {
  const { data: txHash, mutate: sendTransaction, isLoading: isSendingTransaction, reset, status, error } = useMutation<
    string,
    Error
  >(['sendTransaction'], () => onOk());

  function onModalCancel(cb?: () => void) {
    if (isSendingTransaction) return;
    cb?.();
    reset();
  }

  const confirmContent = (() => {
    if (status === 'success' && txHash) {
      return <SuccessResult txHash={txHash} onDismiss={() => onModalCancel(onSuccessfulDismiss)} />;
    }

    if (status === 'error' && error) {
      return <DeclineResult errMessage={error?.message} onDismiss={() => onModalCancel(onErrorDismiss)} />;
    }

    return (
      <OperationConfirmationWrapper className={className}>
        <div className="label">{i18n.t('Operation')}</div>
        <div>{operation}</div>
        <section className="confirm-content">{children}</section>
        <Button block type={confirmButtonType} onClick={() => sendTransaction()} loading={isSendingTransaction}>
          {confirmText ?? i18n.t('Confirm')}
        </Button>
      </OperationConfirmationWrapper>
    );
  })();

  return (
    <ModalContainer
      onCancel={() => onModalCancel(onCancel)}
      width={360}
      title={i18n.t('Review')}
      visible={visible}
      footer={false}
    >
      {confirmContent}
    </ModalContainer>
  );
};
