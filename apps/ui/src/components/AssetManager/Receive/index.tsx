import { Typography } from 'antd';
import { AssetManagerHeader } from 'components/AssetManager/AssetManagerHeader';
import { RadioItem, RadioTabs } from 'components/AssetManager/components/RadioTabs';
import { useGliaswap } from 'hooks';
import QRCode from 'qrcode.react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const { Text } = Typography;

const ReceiveWrapper = styled.div`
  text-align: center;
  padding: 16px;

  .title {
    color: #888;
    padding: 8px;
  }

  .qr-code {
    padding: 24px;
  }
`;

export const Receive: React.FC = () => {
  const { t } = useTranslation();
  const { currentCkbAddress: address } = useGliaswap();

  const qrCodeContent = useMemo(
    () => (
      <>
        <QRCode style={{ width: '200px', height: '200px' }} className="qr-code" value={address} />
        <Text copyable strong>
          {address}
        </Text>
      </>
    ),
    [address],
  );

  return (
    <>
      <AssetManagerHeader showGoBack title={t('Receive')} />
      <ReceiveWrapper>{qrCodeContent}</ReceiveWrapper>
    </>
  );
};

/**
 * @deprecated
 */
export const SelectableReceive: React.FC = () => {
  const [receiveWalletType, setReceiveWalletType] = useState('ckb');
  const { t } = useTranslation();
  const { currentCkbAddress: address } = useGliaswap();

  const qrCodeContent = useMemo(
    () => (
      <>
        <QRCode style={{ width: '200px', height: '200px' }} className="qr-code" value={address} />
        <Text copyable strong>
          {address}
        </Text>
      </>
    ),
    [address],
  );

  function changeWallet(inputType: string) {
    setReceiveWalletType(inputType);
  }

  return (
    <>
      <AssetManagerHeader showGoBack title={t('Receive')} />
      <ReceiveWrapper>
        <div className="title">{t('Receive from')}</div>
        <RadioTabs value={receiveWalletType} onChange={changeWallet}>
          <RadioItem key="portal">{t('Portal Wallet')}</RadioItem>
          <RadioItem key="ckb">{t('Wallets or Exchanges')}</RadioItem>
        </RadioTabs>
        {qrCodeContent}
      </ReceiveWrapper>
    </>
  );
};
