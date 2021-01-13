import { QuestionOutlined } from '@ant-design/icons';
import Icon from '@ant-design/icons/es/components/Icon';
import { Button } from 'antd';
import { useAdapter, Web3ModalAdapter } from 'commons/WalletAdapter';
import i18n from 'i18n';
import React, { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { truncateMiddle } from 'utils';
import { providers } from 'web3modal';

const ConnectButtonWrapper = styled.span`
  .logo {
    width: 20px;
    height: 20px;
    vertical-align: text-bottom;
  }
`;

export const WalletConnectButton: React.FC = (props) => {
  const { ...buttonProps } = props;
  const adapter = useAdapter<Web3ModalAdapter>();

  const connectStatus = adapter.status;

  // auto connect if cached provider is found
  useEffect(() => {
    const disconnected = connectStatus === 'disconnected';
    const hasConnected = adapter.raw.modal.cachedProvider;
    if (disconnected && hasConnected) adapter.connect();
  }, [connectStatus, adapter]);

  const buttonText = useMemo(() => {
    if (connectStatus === 'connected') return truncateMiddle(adapter.signer.address.toCKBAddress());
    if (connectStatus === 'disconnected') return i18n.t('Connect Wallet');
    return i18n.t('Connecting');
  }, [connectStatus, adapter]);

  const onClick = useCallback(async () => {
    if (connectStatus !== 'disconnected') return;
    adapter.connect();
  }, [connectStatus, adapter]);

  const logo = useMemo<React.FC | undefined>(() => {
    if (connectStatus !== 'connected' || !adapter.raw.provider) return;

    if (adapter.raw.provider.isMetaMask) return () => <img className="logo" src={providers.METAMASK.logo} alt="logo" />;

    const cachedProvider = adapter.raw.modal.cachedProvider?.toUpperCase();
    if (!(cachedProvider in providers)) return QuestionOutlined;

    const dataImage = providers[cachedProvider as keyof typeof providers]?.logo;
    if (!dataImage) return QuestionOutlined;

    return () => <img className="logo" src={dataImage} alt="logo" />;
  }, [adapter, connectStatus]);

  const connecting = connectStatus === 'connecting';

  return (
    <ConnectButtonWrapper>
      <Button
        {...buttonProps}
        onClick={onClick}
        loading={connecting}
        disabled={connecting}
        icon={logo && <Icon component={logo} />}
      >
        {buttonText}
      </Button>
    </ConnectButtonWrapper>
  );
};
