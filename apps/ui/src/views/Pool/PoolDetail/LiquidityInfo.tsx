import { Spin, Tag } from 'antd';
import { AssetBalanceList, PoolAssetSymbol } from 'components/Asset/AssetBlanaceList';
import { HumanizeBalance } from 'components/Balance';
import { Section, SpaceBetweenRow } from 'components/Layout';
import { exploreTypeHash } from 'envs';
import { useQueryLiquidityInfo, useQueryLiquidityWithShare } from 'hooks/useQueryLiquidity';
import i18n from 'i18n';
import React from 'react';
import { truncateMiddle } from 'utils';

interface LiquidityInfoProps {
  poolId: string;
}

export const LiquidityInfo: React.FC<LiquidityInfoProps> = ({ poolId }) => {
  const { data: poolLiquidity } = useQueryLiquidityInfo(poolId);
  const { data: liquidity, isLoading } = useQueryLiquidityWithShare(poolId);

  if (isLoading) {
    return (
      <Section>
        <Spin />
      </Section>
    );
  }

  return (
    <Section>
      <SpaceBetweenRow>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
          <PoolAssetSymbol assets={poolLiquidity?.assets ?? []} />
        </div>
        <Tag style={{ marginRight: 0 }}>{poolLiquidity?.model ?? '-'}</Tag>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Pool ID')}</div>
        <div>
          <a rel="noreferrer" href={exploreTypeHash(poolId)} target="_blank">
            {truncateMiddle(poolId)}
          </a>
        </div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Your LP Token')}</div>
        <div>
          {liquidity?.lpToken ? <HumanizeBalance asset={liquidity.lpToken} value={liquidity.lpToken.balance} /> : '-'}
        </div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Pool Share')}</div>
        <div>{liquidity?.share ? liquidity.share * 100 : '-'}%</div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Your Liquidity')}</div>
        <div>
          <AssetBalanceList assets={liquidity?.assets ?? []} hideSymbolIcon />
        </div>
      </SpaceBetweenRow>
    </Section>
  );
};
