import { LiquidityOperationSummary } from '@gliaswap/commons';
import { Button, Divider, List, Typography } from 'antd';
import { ReactComponent as DownArrowSvg } from 'assets/svg/down-arrow.svg';
import { AssetBalanceList, PoolAssetSymbol } from 'components/Asset/AssetBlanaceList';
import { HumanizeBalance } from 'components/Balance';
import { Section, SpaceBetweenRow } from 'components/Layout';
import { QueryTips } from 'components/QueryTips';
import dayjs from 'dayjs';
import { useGliaswap } from 'hooks';
import { useCancelLiquidityOperation } from 'hooks/useCancelLiquidityOperation';
import i18n from 'i18n';
import { upperFirst } from 'lodash';
import React, { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { truncateMiddle } from 'utils';
import { TransactionFeeLabel } from './LiquidityOperation/components/TransactionFeeLabel';
import { OperationConfirmModal } from './LiquidityOperation/OperationConfirmModal';

const { Text } = Typography;

interface LiquidityOrderItemProps {
  summary: LiquidityOperationSummary;
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
        <Link to={`/pool/${summary.poolId}`}>{truncateMiddle(summary.poolId)}</Link>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t(upperFirst(summary.type))}</div>
        <AssetBalanceList assets={summary.assets} hideSymbolIcon />
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div />
        <div>
          <Button
            size="small"
            onClick={props.onCancel}
            loading={summary.status !== 'open'}
            disabled={summary.status !== 'open'}
          >
            {summary.status === 'pending' ? 'Pending' : summary.status === 'open' ? 'Cancel' : 'Canceling'}
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
  const poolId = props.poolId;
  const { api, currentUserLock } = useGliaswap();
  const [readyToCancelOperation, setReadyToCancelOperation] = useState<LiquidityOperationSummary | null>(null);

  const query = useQuery(
    ['getLiquidityOperationSummaries', poolId, currentUserLock],
    () => {
      if (!currentUserLock) throw new Error('The current user is lock is not found, maybe the wallet is disconnected');
      return api.getLiquidityOperationSummaries({ lock: currentUserLock, poolId });
    },
    { enabled: currentUserLock != null, refetchInterval: 10000 },
  );

  const {
    generateCancelLiquidityOperationTransaction,
    readyToSendTransaction,
    sendCancelLiquidityOperationTransaction,
  } = useCancelLiquidityOperation();

  async function prepareCancelOperation(operation: LiquidityOperationSummary): Promise<void> {
    setReadyToCancelOperation(operation);
    await generateCancelLiquidityOperationTransaction(operation.txHash);
  }

  const { data: summaries } = query;
  const { mutateAsync: sendCancelOperationTransaction } = useMutation(['sendCancelLiquidityOperation'], async () =>
    sendCancelLiquidityOperationTransaction(),
  );

  if (!currentUserLock) return null;

  const lpTokenInfoEl = readyToCancelOperation && (
    <SpaceBetweenRow style={{ fontWeight: 'bold' }}>
      <div>
        <HumanizeBalance asset={readyToCancelOperation.lpToken} />
      </div>
      <div>
        <PoolAssetSymbol assets={readyToCancelOperation.assets} />
      </div>
    </SpaceBetweenRow>
  );

  const operationAssetsEl = readyToCancelOperation && (
    <AssetBalanceList assets={readyToCancelOperation.assets} style={{ fontWeight: 'bold' }} />
  );

  return (
    <LiquidityOrderListWrapper>
      <SpaceBetweenRow className="title">
        <div>
          {i18n.t('My Pending Request')}
          <QueryTips query={query} />
        </div>
      </SpaceBetweenRow>
      <Divider style={{ margin: '4px 0 0' }} />

      <List
        pagination={{ position: 'bottom', size: 'small' }}
        bordered={false}
        dataSource={summaries}
        renderItem={(summary) => (
          <List.Item key={summary.txHash}>
            <LiquidityOrderSummarySection summary={summary} onCancel={() => prepareCancelOperation(summary)} />
          </List.Item>
        )}
      />

      <OperationConfirmModal
        visible={!!readyToCancelOperation}
        onOk={() => sendCancelOperationTransaction()}
        onCancel={() => setReadyToCancelOperation(null)}
        operation={
          readyToCancelOperation && (
            <Text strong type="danger">
              {readyToCancelOperation.type === 'add'
                ? i18n.t(`Cancel Add Liquidity`)
                : i18n.t(`Cancel Remove Liquidity`)}
            </Text>
          )
        }
      >
        {readyToCancelOperation && (
          <>
            <div className="label">{i18n.t(upperFirst(readyToCancelOperation.type))}</div>

            {readyToCancelOperation.type === 'add' ? operationAssetsEl : lpTokenInfoEl}

            <div style={{ padding: '8px 0' }}>
              <DownArrowSvg />
            </div>

            <div className="label">{i18n.t('Receive(EST)')}</div>
            {readyToCancelOperation.type === 'add' ? lpTokenInfoEl : operationAssetsEl}

            <SpaceBetweenRow>
              <TransactionFeeLabel />
              <HumanizeBalance
                asset={{ symbol: 'CKB', decimals: 8 }}
                value={readyToSendTransaction?.fee}
                maxToFormat={8}
                showSuffix
              />
            </SpaceBetweenRow>
          </>
        )}
      </OperationConfirmModal>
    </LiquidityOrderListWrapper>
  );
};
