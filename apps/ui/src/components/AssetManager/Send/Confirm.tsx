import { Button, Divider } from 'antd';
import { AssetSymbol } from 'components/Asset/AssetSymbol';
import { AssetManagerHeader } from 'components/AssetManager/AssetManagerHeader';
import { useAssetManager } from 'components/AssetManager/hooks';
import { HumanizeBalance } from 'components/Balance';
import { useGliaswap } from 'hooks';
import i18n from 'i18n';
import { parse } from 'query-string';
import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const ConfirmWrapper = styled.div`
  padding: 16px;

  .label {
    color: #666;
    margin-bottom: 8px;
  }

  .item {
    margin-bottom: 8px;
    word-break: break-all;
    color: #000;
  }

  .btn-confirm {
    margin-top: 16px;
  }
`;

interface ConfirmParamsPayload {
  amount: string;
  fee: string;
  to: string;
}

export const SendConfirm = () => {
  const [confirming, setIsConfirming] = useState(false);

  const { search } = useLocation();
  const { replace } = useHistory();
  const { currentCkbAddress } = useGliaswap();
  const { currentAsset, sendConfirmingTx } = useAssetManager();

  const from = currentCkbAddress;
  const payload: ConfirmParamsPayload = (parse(search) as unknown) as ConfirmParamsPayload;
  const { amount, fee, to } = payload;
  const typeHash = currentAsset.typeHash;

  async function onConfirm() {
    setIsConfirming(true);
    try {
      const txHash = await sendConfirmingTx();
      if (txHash) replace(`/assets/${typeHash}#transactions`);
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <>
      <AssetManagerHeader showGoBack title={i18n.t('Confirm')} />
      <ConfirmWrapper>
        <div className="label">{i18n.t('Token')}</div>
        <div className="item">
          <AssetSymbol asset={currentAsset} />
        </div>

        <Divider />

        <div className="label">{i18n.t('Amount')}</div>
        <div className="item">
          <HumanizeBalance asset={currentAsset} value={amount} />
        </div>

        <Divider />

        <div className="label">{i18n.t('To')}</div>
        <div className="item">{to}</div>

        <Divider />

        <div className="label">{i18n.t('From')}</div>
        <div className="item">{from}</div>

        <Divider />

        <div className="label">{i18n.t('Transaction Fee')}</div>
        <div className="item">
          <HumanizeBalance asset={currentAsset} value={fee} maxToFormat={8} />
        </div>

        <Button className="btn-confirm" block size="large" onClick={onConfirm} loading={confirming}>
          {i18n.t('Confirm')}
        </Button>
      </ConfirmWrapper>
    </>
  );
};
