import { QuestionOutlined } from '@ant-design/icons';
import Icon from '@ant-design/icons/es/components/Icon';
import { Button, Popover } from 'antd';
import { ButtonProps } from 'antd/lib/button';
import { useWalletAdapter, Web3ModalAdapter } from 'commons/WalletAdapter';
import { AssetManager } from 'components/AssetManager';
import i18n from 'i18n';
import React, { useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { truncateMiddle } from 'utils';
import { providers } from 'web3modal';
import './index.css';

const ConnectButtonWrapper = styled.span`
  .logo {
    width: 20px;
    height: 20px;
    vertical-align: text-bottom;
  }
`;

export const WalletConnectButton: React.FC = (props) => {
  const { ...buttonProps } = props;
  const adapter = useWalletAdapter<Web3ModalAdapter>();

  const connectStatus = adapter.status;

  // auto connect if cached provider is found
  useEffect(() => {
    const disconnected = connectStatus === 'disconnected';
    const hasConnected = adapter.raw.web3Modal.cachedProvider;
    if (disconnected && hasConnected) adapter.connect();
  }, [connectStatus, adapter]);

  const buttonText = useMemo(() => {
    if (adapter.status === 'connected') return truncateMiddle(adapter.signer.address);
    if (connectStatus === 'disconnected') return i18n.t('Connect Wallet');
    return i18n.t('Connecting');
  }, [connectStatus, adapter]);

  const onClick: ButtonProps['onClick'] = useCallback(async () => {
    if (connectStatus !== 'disconnected') return;
    adapter.connect();
  }, [connectStatus, adapter]);

  const logo = useMemo<React.FC | undefined>(() => {
    if (connectStatus !== 'connected' || !adapter.raw.provider) return;

    if (adapter.raw.provider.isMetaMask) return () => <img className="logo" src={providers.METAMASK.logo} alt="logo" />;

    const cachedProvider = adapter.raw.web3Modal.cachedProvider?.toUpperCase();
    if (!(cachedProvider in providers)) return QuestionOutlined;

    const dataImage = providers[cachedProvider as keyof typeof providers]?.logo;
    if (!dataImage) return QuestionOutlined;

    return () => <img className="logo" src={dataImage} alt="logo" />;
  }, [adapter, connectStatus]);

  const connecting = connectStatus === 'connecting';

  return (
    <ConnectButtonWrapper>
      <Popover overlayClassName="wallet-overlay" placement="bottomLeft" trigger="click" content={<AssetManager />}>
        <Button
          style={{ borderRadius: '10px' }}
          {...buttonProps}
          onClick={onClick}
          loading={connecting}
          disabled={connecting}
          icon={logo && <Icon component={logo} />}
        >
          {buttonText}
        </Button>
      </Popover>
    </ConnectButtonWrapper>
  );
};
