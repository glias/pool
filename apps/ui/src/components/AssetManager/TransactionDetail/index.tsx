import { QuestionCircleFilled } from '@ant-design/icons';
import { isCkbNativeAsset, TransactionStatus, TransferDetail as TransactionDetailModel } from '@gliaswap/commons';
import { Divider, Result, Spin } from 'antd';
import { AssetSymbol } from 'components/Asset/AssetSymbol';
import { AssetManagerHeader } from 'components/AssetManager/AssetManagerHeader';
import { Balance } from 'components/AssetManager/Balance';
import { TransactionStatusIcon } from 'components/AssetManager/components/TransactionStatus';
import { useAssetManager } from 'components/AssetManager/hooks';
import { HumanizeBalance } from 'components/Balance';
import { useGliaswap } from 'contexts';
import { exploreBlock, exploreTransaction } from 'envs';
import i18n from 'i18n';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

type TransactionDirection = 'in' | 'out';

const TransactionDetailWrapper = styled.div`
  padding: 16px;

  .ant-result {
    padding: 8px;
  }

  table {
    width: 100%;
  }

  td,
  th {
    padding: 4px;
  }

  th {
    color: #666666;
    white-space: nowrap;

    width: 100px;
  }

  td {
    word-break: break-all;
  }

  .ant-divider {
    margin-top: 0;
  }

  a {
    text-decoration: underline;
  }
`;

interface ResultMainProps {
  status: TransactionStatus;
  direction: TransactionDirection;
}

const UnknownResultMain: React.FC = () => {
  const { t } = useTranslation();
  const unknown = t('Unknown');
  return <Result icon={<QuestionCircleFilled />} title={unknown} />;
};

const ResultMain: React.FC<ResultMainProps> = (props: ResultMainProps) => {
  const { status, direction } = props;
  const { t } = useTranslation();

  let displayStatus = '';
  if (status === 'committed') {
    if (direction === 'in') displayStatus = t('Received');
    if (direction === 'out') displayStatus = t('Sent');
  } else {
    if (direction === 'in') displayStatus = t('Receiving');
    if (direction === 'out') displayStatus = t('Sending');
  }

  return (
    <Result
      icon={<TransactionStatusIcon direction={direction} status={status} width={48} height={48} />}
      title={displayStatus}
    />
  );
};

const TransactionDescription = (props: { transaction: TransactionDetailModel; txHash: string }) => {
  const { t } = useTranslation();
  const { transaction: tx, txHash } = props;
  const { amount, blockNumber, fee } = tx;
  const { currentAsset } = useAssetManager();

  const isCkb = isCkbNativeAsset(currentAsset);

  return (
    <table>
      <tbody>
        <tr>
          <th>{t('Token')}</th>
          <td>
            <AssetSymbol asset={currentAsset} />
          </td>
        </tr>

        <tr>
          <th>{t('Amount')}</th>
          <td>
            <HumanizeBalance asset={currentAsset} value={amount} maxToFormat={isCkb ? 8 : undefined} />
          </td>
        </tr>

        <tr>
          <th>{t('Transaction fee')}</th>
          <td>
            <Balance value={fee} decimal={8} suffix="CKB" maxDecimalPlaces={8} />
          </td>
        </tr>

        <tr>
          <td colSpan={2}>
            <Divider />
          </td>
        </tr>

        <tr>
          <th>{t('Hash')}</th>
          <td>
            <a target="_blank" rel="noopener noreferrer" href={exploreTransaction(txHash)}>
              {txHash}
            </a>
          </td>
        </tr>

        <tr>
          <th>{t('Block No.')}</th>
          <td>
            {blockNumber ? (
              <a target="_blank" rel="noopener noreferrer" href={exploreBlock(blockNumber)}>
                {blockNumber}
              </a>
            ) : (
              '-'
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export const TransactionDetail: React.FC = () => {
  const { txHash } = useParams<{ tokenName: string; txHash: string }>();
  const { currentUserLock } = useGliaswap();
  const { assetAPI, currentAsset } = useAssetManager();

  const { data: tx, isLoading } = useQuery(['transactions', txHash], () => {
    if (!currentUserLock) throw new Error('the wallet is not connected');
    return assetAPI.getTransactionDetail({ asset: currentAsset, lock: currentUserLock, txHash });
  });

  let descriptions: React.ReactNode;
  if (isLoading) {
    descriptions = (
      <Result>
        <Spin />
      </Result>
    );
  } else if (tx && currentUserLock) {
    const direction: TransactionDirection = tx.amount.startsWith('-') ? 'out' : 'in';

    descriptions = (
      <>
        <ResultMain status={tx.status as TransactionStatus} direction={direction} />
        <Divider />
        <TransactionDescription transaction={tx} txHash={txHash} />
      </>
    );
  } else {
    descriptions = <UnknownResultMain />;
  }

  return (
    <>
      <AssetManagerHeader showGoBack title={i18n.t('Transaction Detail')} />
      <TransactionDetailWrapper>{descriptions}</TransactionDetailWrapper>
    </>
  );
};
