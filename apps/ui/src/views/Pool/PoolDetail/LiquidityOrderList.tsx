import { LiquidityOrderSummary } from '@gliaswap/commons';
import { Divider, Skeleton } from 'antd';
import { AssetBalanceList } from 'components/Asset/AssetBlanaceList';
import { Section, SpaceBetweenRow } from 'components/Layout';
import { useGliaswap } from 'contexts';
import { exploreTypeHash } from 'envs';
import i18n from 'i18n';
import React from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';

interface LiquidityOrderItemProps {
  summary: LiquidityOrderSummary;
}

const LiquidityOrderSummarySectionWrapper = styled.div``;

const LiquidityOrderSummarySection: React.FC<LiquidityOrderItemProps> = (props) => {
  const summary = props.summary;
  return (
    <LiquidityOrderSummarySectionWrapper>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Time')}</div>
        <div>{summary.time}</div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Pool ID')}</div>
        <a href={exploreTypeHash(summary.poolId)} target="_blank" rel="noreferrer">
          {summary.poolId}
        </a>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Liquidity')}</div>
        <AssetBalanceList assets={summary.assets} hideSymbolIcon />
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

  ${LiquidityOrderSummarySectionWrapper}:nth-child(odd) {
    background: rgba(0, 0, 0, 0.04);
  }
`;

export const LiquidityOrderList: React.FC<LiquidityOrderListProps> = (props) => {
  const { api, currentUserLock } = useGliaswap();
  const poolId = props.poolId;
  const { data: summaries, isLoading } = useQuery(
    ['getLiquidityOrderSummaries', poolId],
    () => api.getAddLiquidityOrderSummaries({ lock: currentUserLock!, poolId }),
    { enabled: currentUserLock != null },
  );

  if (!currentUserLock) return null;

  if (isLoading || !summaries) {
    return (
      <Section>
        <Skeleton />
      </Section>
    );
  }

  return (
    <LiquidityOrderListWrapper>
      <SpaceBetweenRow className="title">{i18n.t('My Pending Request')}</SpaceBetweenRow>
      <Divider style={{ margin: '4px 0 0' }} />
      {summaries.map((summary) => (
        <LiquidityOrderSummarySection key={summary.txHash} summary={summary} />
      ))}
    </LiquidityOrderListWrapper>
  );
};
