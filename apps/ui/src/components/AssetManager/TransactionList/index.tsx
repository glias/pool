import { isCkbNativeAsset, TransferSummary } from '@gliaswap/commons';
import { Col, List, Row, Spin, Tooltip, Typography } from 'antd';
import { RadioItem, RadioTabs } from 'components/AssetManager/components/RadioTabs';
import { TransactionStatusIcon } from 'components/AssetManager/components/TransactionStatus';
import { useAssetManager } from 'components/AssetManager/hooks';
import { TransactionDirection } from 'components/AssetManager/suite';
import { HumanizeBalance } from 'components/Balance';
import { useGliaswap } from 'hooks';
import i18n from 'i18next';
import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

const { Text, Title } = Typography;

interface TransactionListItemProps {
  transaction: TransferSummary;
}

const SpinWrapper = styled.div`
  padding: 30px;
  text-align: center;
`;

const TransactionListItemWrapper = styled.div`
  font-size: 12px;
  padding: 16px;
  cursor: pointer;

  :nth-child(odd) {
    background: #f6f6f6;
  }

  .ant-row {
    flex-wrap: nowrap;
  }

  .ant-col {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .amount {
    font-weight: bold;
  }

  .symbol {
    padding-right: 8px;
  }
`;

const TransactionListItem: React.FC<TransactionListItemProps> = (props: TransactionListItemProps) => {
  const { transaction: tx } = props;
  const { push } = useHistory();
  const { currentAsset } = useAssetManager();

  const typeHash = currentAsset.typeHash;

  const isCkb = isCkbNativeAsset(currentAsset);
  const direction = tx.amount.startsWith('-') ? 'out' : 'in';
  return (
    <TransactionListItemWrapper onClick={() => push(`/assets/${typeHash}/transactions/${tx.txHash}`)}>
      <Row gutter={8} align="middle">
        <Col flex="40px">
          <TransactionStatusIcon status={tx.status} direction={direction} filled width={18} />
        </Col>
        <Col flex="auto">
          <Row gutter={8}>
            <Col flex="auto">
              <Tooltip title={tx.txHash}>{tx.txHash}</Tooltip>
            </Col>
            <Col flex="none">
              <Text type="secondary">{tx.date}</Text>
            </Col>
          </Row>
          <Row justify="end" className="amount" style={{ paddingTop: '4px' }}>
            <span className="symbol">{direction === 'in' ? '+' : '-'}</span>
            <HumanizeBalance value={tx.amount} asset={currentAsset} showSuffix maxToFormat={isCkb ? 8 : undefined} />
          </Row>
        </Col>
      </Row>
    </TransactionListItemWrapper>
  );
};

const TransactionListWrapper = styled.div`
  .ant-list {
    max-height: 285px;
    overflow: auto;
  }
`;

export const TransactionList = () => {
  const [transferDirection, setTransferDirectionFilter] = useState<'all' | TransactionDirection>('all');
  const { currentUserLock } = useGliaswap();
  const { currentAsset, assetAPI } = useAssetManager();

  const tokenName = currentAsset.typeHash;

  const { data: txs, isLoading } = useQuery<TransferSummary[]>(['transactions', tokenName, transferDirection], () => {
    if (!currentUserLock) throw new Error('Not yet connected to a wallet');
    return assetAPI.getTransactionSummaries({
      asset: currentAsset,
      lock: currentUserLock,
      direction: transferDirection,
    });
  });

  function onDirectionChange(direction: string) {
    setTransferDirectionFilter(direction as 'all' | TransactionDirection);
  }

  const transferList: React.ReactNode = useMemo(() => {
    if (isLoading) {
      return (
        <SpinWrapper>
          <Spin size="large" tip="loading..." />
        </SpinWrapper>
      );
    }
    if (txs && txs.length > 0) {
      return txs.map((tx: TransferSummary) => <TransactionListItem key={tx.txHash} transaction={tx} />);
    }
    return (
      <Title style={{ textAlign: 'center', padding: '16px' }} level={3} type="secondary">
        {i18n.t('No related transactions')}
      </Title>
    );
  }, [txs, isLoading]);

  return (
    <TransactionListWrapper>
      <RadioTabs
        style={{ boxShadow: '3px 3px 8px rgba(0, 0, 0, 0.08)' }}
        mode="underline"
        value={transferDirection}
        onChange={onDirectionChange}
      >
        <RadioItem key="all">{i18n.t('All')}</RadioItem>
        <RadioItem key="in">{i18n.t('In')}</RadioItem>
        <RadioItem key="out">{i18n.t('Out')}</RadioItem>
      </RadioTabs>

      <List>{transferList}</List>
    </TransactionListWrapper>
  );
};
