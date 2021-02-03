import { Button } from 'antd';
import { ModalContainer } from 'components/ModalContainer';
import i18n from 'i18n';
import React, { useState } from 'react';
import styled from 'styled-components';

interface LiquidityOperationConfirmProps {
  operation: React.ReactNode;
  confirm?: React.ReactNode;
  onOk: () => Promise<unknown>;
  onCancel?: () => void;
  className?: string;
  visible?: boolean;
}

const LiquidityOperationConfirmWrapper = styled.div`
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
  confirm,
  className,
  children,
  onOk,
  onCancel,
  visible,
}) => {
  const [confirming, setConfirming] = useState(false);

  async function onClick() {
    setConfirming(true);
    onOk().then(() => setConfirming(false));
  }

  return (
    <ModalContainer onCancel={onCancel} width={360} title={i18n.t('Review')} visible={visible} footer={false}>
      <LiquidityOperationConfirmWrapper className={className}>
        <div className="label">{i18n.t('Operation')}</div>
        <div>{operation}</div>
        <section className="confirm-content">{children}</section>
        <Button type="primary" block onClick={onClick} loading={confirming}>
          {confirm ?? i18n.t('Confirm')}
        </Button>
      </LiquidityOperationConfirmWrapper>
    </ModalContainer>
  );
};
