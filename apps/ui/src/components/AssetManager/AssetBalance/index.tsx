import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { isCkbNativeAsset } from '@gliaswap/commons';
import { Button } from 'antd';
import { BalanceStatus } from 'components/AssetManager/AssetBalance/BalanceStatus';
import { TokenTabs } from 'components/AssetManager/AssetBalance/TokenTabs';
import { WalletConnectionStatusHeader } from 'components/AssetManager/AssetManagerHeader';
import { useAssetManager } from 'components/AssetManager/hooks';
import { exploreAddress, exploreSudt } from 'envs';
import { useGliaswap } from 'hooks';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

const OperationsWrapper = styled.div`
  text-align: center;
  margin-bottom: 16px;

  padding: 4px 32px;

  .ant-btn {
    margin-bottom: 4px;
  }
`;

export const Operations = () => {
  const { t } = useTranslation();
  const { push } = useHistory();
  const { currentAsset } = useAssetManager();
  const { currentCkbAddress } = useGliaswap();
  const typeHash = currentAsset.typeHash;

  const exploreUrl = isCkbNativeAsset(currentAsset)
    ? exploreAddress(currentCkbAddress)
    : exploreSudt(typeHash, currentCkbAddress);

  return (
    <OperationsWrapper>
      {/*<Button*/}
      {/*  icon={<SendOutlined />}*/}
      {/*  style={{ marginRight: '16px', height: '40px' }}*/}
      {/*  onClick={() => push(`/assets/${typeHash}/send`)}*/}
      {/*>*/}
      {/*  {t('Send')}*/}
      {/*</Button>*/}
      <Button block icon={<DownloadOutlined />} onClick={() => push(`/assets/${typeHash}/receive`)}>
        <span>{t('Receive')}</span>
      </Button>
      <Button block href={exploreUrl} icon={<EyeOutlined />}>
        {t('View on CKB Explorer')}
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
