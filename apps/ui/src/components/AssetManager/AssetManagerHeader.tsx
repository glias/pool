import { LeftOutlined } from '@ant-design/icons';
import { Button, Col, Row, Typography } from 'antd';
import { useGliaswap } from 'hooks';
import React, { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { truncateMiddle } from 'utils';
import { getProviderInfo } from 'web3modal';

const { Text } = Typography;

const AssetManagerHeaderWrapper = styled.header`
  height: 40px;
  padding: 8px 16px;

  font-weight: bold;
  font-size: 18px;
  text-align: center;
`;

interface AssetManagerHeaderProps extends HTMLAttributes<HTMLDivElement> {
  showGoBack?: boolean;
}

export const AssetManagerHeader: React.FC<AssetManagerHeaderProps> = (props: AssetManagerHeaderProps) => {
  const { children, showGoBack, title } = props;
  const { goBack } = useHistory();

  return (
    <AssetManagerHeaderWrapper>
      <Row align="middle">
        <Col flex="24px">{showGoBack && <LeftOutlined onClick={() => goBack()} />}</Col>
        {children && <Col flex="auto">{children}</Col>}
        {!children && title && <Col flex="auto">{title}</Col>}
        {showGoBack && <Col flex="24px" />}
      </Row>
    </AssetManagerHeaderWrapper>
  );
};

const WalletConnectionStatusHeaderWrapper = styled.div`
  padding: 10px 14px;
  display: flex;
  align-content: space-between;
  flex-wrap: nowrap;
  align-items: center;
  box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.08);
  font-size: 12px;

  .wallet {
    color: #888888;
  }

  .address {
    font-weight: 400;
  }

  .info-connection {
    flex: auto;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .button {
  }
`;

export const WalletConnectionStatusHeader = () => {
  const { t } = useTranslation();
  const { adapter, currentCkbAddress } = useGliaswap();

  const { status, raw } = adapter;
  const address = currentCkbAddress;

  if (status !== 'connected') return null;

  async function reconnect() {
    await adapter.disconnect();
    await adapter.connect();
  }

  const provider = getProviderInfo(raw.provider);
  const connected = provider.name;

  return (
    <WalletConnectionStatusHeaderWrapper>
      <div className="info-connection">
        <div className="wallet">
          {t('Connected to')}&nbsp;<Text strong>{connected}</Text>
        </div>
        <div className="address">
          <Text copyable={{ text: address }}>{truncateMiddle(address, 16)}</Text>
        </div>
      </div>
      <div className="button">
        <Button size="small" type="link" onClick={reconnect}>
          {t('Change')}
        </Button>
      </div>
    </WalletConnectionStatusHeaderWrapper>
  );
};
