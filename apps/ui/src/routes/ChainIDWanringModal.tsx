import { WarningOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useChainId } from 'commons/WalletAdapter/hooks/useEvents';
import { UIEnvs } from 'envs';
import { useGliaswap } from 'hooks';
import i18n from 'i18n';
import React from 'react';

const supportedChainId = Number(UIEnvs.get('ETH_CHAIN_ID'));
const chainName = UIEnvs.get('ETH_CHAIN_NAME');

export const ChainIDWarningModal = () => {
  const { chainId } = useChainId();
  const { adapter } = useGliaswap();
  // check if is Rinkeby Network
  const visible = adapter.status === 'connected' && !!chainId && Number(chainId) !== supportedChainId;

  return (
    <Modal closable={false} width={360} visible={visible} footer={false}>
      <WarningOutlined style={{ color: '#faad14', fontSize: '18px', marginRight: '8px' }} />
      {i18n.t(
        `Only ${chainName} Network is supported at this stage. Please connect your Ethereum wallet to ${chainName} Test Network.Only Rinkeby Network is supported at this stage. Please connect your Ethereum wallet to Rinkeby Test Network.`,
      )}
    </Modal>
  );
};
