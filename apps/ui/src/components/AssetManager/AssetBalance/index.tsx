import { DownloadOutlined, SendOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { BalanceStatus } from 'components/AssetManager/AssetBalance/BalanceStatus';
import { TokenTabs } from 'components/AssetManager/AssetBalance/TokenTabs';
import { WalletConnectionStatusHeader } from 'components/AssetManager/AssetManagerHeader';
import { useAssetManager } from 'components/AssetManager/hooks';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

const OperationsWrapper = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

export const Operations = () => {
  const { t } = useTranslation();
  const { push } = useHistory();
  const { currentAsset } = useAssetManager();
  const typeHash = currentAsset.typeHash;

  return (
    <OperationsWrapper>
      <Button
        icon={<SendOutlined />}
        style={{ marginRight: '16px', height: '40px' }}
        onClick={() => push(`/assets/${typeHash}/send`)}
      >
        {t('Send')}
      </Button>
      <Button
        icon={<DownloadOutlined />}
        style={{ height: '40px' }}
        onClick={() => push(`/assets/${typeHash}/receive`)}
      >
        <span>{t('Receive')}</span>
      </Button>
    </OperationsWrapper>
  );
};

export const AssetBalance: React.FC = () => {
  const { currentAsset } = useAssetManager();

  if (!currentAsset) return null;

  return (
    <>
      <WalletConnectionStatusHeader />
      <BalanceStatus asset={currentAsset} />
      <Operations />
      <TokenTabs />
    </>
  );
};
