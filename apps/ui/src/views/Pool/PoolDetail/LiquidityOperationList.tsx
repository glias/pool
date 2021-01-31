import { ArrowDownOutlined } from '@ant-design/icons';
import { LiquidityRequestSummary } from '@gliaswap/commons';
import { Button, Divider, List, Typography } from 'antd';
import { AssetBalanceList, PoolAssetSymbol } from 'components/Asset/AssetBlanaceList';
import { HumanizeBalance } from 'components/Balance';
import { Section, SpaceBetweenRow } from 'components/Layout';
import { QueryTips } from 'components/QueryTips';
import dayjs from 'dayjs';
import { exploreTypeHash } from 'envs';
import { useGliaswap } from 'hooks';
import { useCancelLiquidityOperation } from 'hooks/useCancelLiquidityOperation';
import { usePendingCancelOrders } from 'hooks/usePendingCancelOrders';
import i18n from 'i18n';
import { upperFirst } from 'lodash';
import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import styled from 'styled-components';
import { truncateMiddle } from 'utils';
import { TransactionFeeLabel } from './LiquidityOperation/components/TransactionFeeLabel';
import { OperationConfirmModal } from './LiquidityOperation/OperationConfirmModal';

const { Text } = Typography;

interface LiquidityOrderItemProps {
  summary: LiquidityRequestSummary;
  onCancel: () => void;
}

const LiquidityOrderSummarySectionWrapper = styled.div`
  width: 100%;
`;

const LiquidityOrderSummarySection: React.FC<LiquidityOrderItemProps> = (props) => {
  const summary = props.summary;
  return (
    <LiquidityOrderSummarySectionWrapper>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Time')}</div>
        <div>{dayjs(summary.time).format('YYYY/MM/DD HH:mm:ss')}</div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Pool ID')}</div>
        <a href={exploreTypeHash(summary.poolId)} target="_blank" rel="noreferrer">
          {truncateMiddle(summary.poolId)}
        </a>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t(upperFirst(summary.type))}</div>
        <AssetBalanceList assets={summary.assets} hideSymbolIcon />
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div />
        <div>
          <Button size="small" onClick={props.onCancel} disabled={summary.status !== 'open'}>
            {summary.status === 'pending' ? 'Pending' : summary.status === 'open' ? 'Cancel' : 'Canceling...'}
          </Button>
        </div>
      </SpaceBetweenRow>
    </LiquidityOrderSummarySectionWrapper>
  );
};

interface LiquidityOrderListProps {
  poolId: string;
}

const LiquidityOrderListWrapper = styled(Section)`
  .title {
    font-size: 14px;
    font-weight: bold;
  }

  ${LiquidityOrderSummarySectionWrapper} {
    padding: 4px;
  }

  .ant-list-item {
    border-bottom: none;
    padding: 4px;

    &:nth-child(odd) {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
`;

export const LiquidityOperationList: React.FC<LiquidityOrderListProps> = (props) => {
  const { api, currentUserLock } = useGliaswap();
  const poolId = props.poolId;
  const [cancelingHashes, , , helper] = usePendingCancelOrders();
  const query = useQuery<LiquidityRequestSummary[]>(
    ['getLiquidityOperationSummaries', poolId, currentUserLock?.args, cancelingHashes],
    async () => {
      const operations = await api.getLiquidityOperationSummaries({ lock: currentUserLock!, poolId });
      return operations.map((op) => (helper.containsTxHash(op.txHash) ? { ...op, status: 'canceling' } : op));
    },
    { enabled: currentUserLock != null },
  );

  const { data: summaries } = query;

  const { cancelLiquidityOperation } = useCancelLiquidityOperation();
  const [readyToCancelOperation, setReadyToCancelOperation] = useState<LiquidityRequestSummary | null>(null);

  const { isLoading: isSendingCancelRequest, mutateAsync: cancelOperation } = useMutation(
    ['sendCancelLiquidityOperation'],
    async () => {
      if (!readyToCancelOperation) return;
      const txHash = await cancelLiquidityOperation(readyToCancelOperation.txHash);
      setReadyToCancelOperation(null);
      return txHash;
    },
  );

  if (!currentUserLock) return null;

  return (
    <LiquidityOrderListWrapper>
      <SpaceBetweenRow className="title">
        <div>
          {i18n.t('My Pending Request')}
          <QueryTips {...query} />
        </div>
      </SpaceBetweenRow>
      <Divider style={{ margin: '4px 0 0' }} />

      <List
        pagination={{ position: 'bottom' }}
        bordered={false}
        dataSource={summaries}
        renderItem={(summary) => (
          <List.Item key={summary.txHash}>
            <LiquidityOrderSummarySection summary={summary} onCancel={() => setReadyToCancelOperation(summary)} />
          </List.Item>
        )}
      />

      <OperationConfirmModal
        visible={!!readyToCancelOperation}
        onOk={() => cancelOperation()}
        onCancel={() => !isSendingCancelRequest && setReadyToCancelOperation(null)}
        operation={
          <Text strong type="danger">
            {i18n.t('Cancel Add Liquidity')}
          </Text>
        }
      >
        {readyToCancelOperation && (
          <>
            <div className="label">{i18n.t(readyToCancelOperation.type)}</div>

            <AssetBalanceList assets={readyToCancelOperation.assets} style={{ fontWeight: 'bold' }} />

            <ArrowDownOutlined style={{ margin: '16px' }} />
            <div className="label">{i18n.t('Receive(EST)')}</div>
            <SpaceBetweenRow style={{ fontWeight: 'bold' }}>
              <div>
                <HumanizeBalance asset={readyToCancelOperation.lpToken} />
              </div>
              <div>
                <PoolAssetSymbol assets={readyToCancelOperation.assets} />
              </div>
            </SpaceBetweenRow>

            <SpaceBetweenRow>
              <TransactionFeeLabel />
              <HumanizeBalance asset={{ symbol: 'CKB', decimals: 8 }} value={0} maxToFormat={8} showSuffix />
            </SpaceBetweenRow>
          </>
        )}
      </OperationConfirmModal>
    </LiquidityOrderListWrapper>
  );
};
