import { WarningOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useChainId } from 'commons/WalletAdapter/hooks/useEvents';
import { useGliaswap } from 'hooks';
import i18n from 'i18n';
import React from 'react';

export const ChainIDWarningModal = () => {
  const { chainId } = useChainId();
  const { adapter } = useGliaswap();
  // check if is Ropsten Network
  const visible = adapter.status === 'connected' && !!chainId && Number(chainId) !== 3;

  return (
    <Modal closable={false} width={360} visible={visible} footer={false}>
      <WarningOutlined style={{ color: '#faad14', fontSize: '18px', marginRight: '8px' }} />
      {i18n.t(
        'Only Ropsten Network is supported at this stage. Please connect your Ethereum wallet to Ropsten Test Network.',
      )}
    </Modal>
  );
};
