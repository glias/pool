import { Skeleton, Tag } from 'antd';
import { AssetBalanceList, PoolAssetSymbol } from 'components/Asset';
import { HumanizeBalance } from 'components/Balance';
import { Section, SpaceBetweenRow } from 'components/Layout';
import { exploreTypeHash } from 'envs';
import { useLiquidityQuery } from 'hooks/useLiquidityQuery';
import i18n from 'i18n';
import React from 'react';
import { truncateMiddle } from 'utils';

interface LiquidityInfoProps {
  poolId: string;
}

export const LiquidityInfo: React.FC<LiquidityInfoProps> = ({ poolId }) => {
  const { poolLiquidityQuery, userLiquidityQuery } = useLiquidityQuery();

  if (poolLiquidityQuery.isLoading) {
    return (
      <Section>
        <Skeleton active />
      </Section>
    );
  }

  const poolLiquidity = poolLiquidityQuery.data;
  const userLiquidity = userLiquidityQuery.data;

  return (
    <Section>
      <SpaceBetweenRow>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
          <PoolAssetSymbol assets={poolLiquidity?.assets ?? []} />
        </div>
        <Tag style={{ marginRight: 0 }}>{poolLiquidity?.model + '-MODEL' ?? '-'}</Tag>
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
          {userLiquidity?.lpToken ? (
            <HumanizeBalance asset={userLiquidity.lpToken} value={userLiquidity.lpToken.balance} />
          ) : (
            '-'
          )}
        </div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Pool Share')}</div>
        <div>{userLiquidity?.share ? (userLiquidity.share * 100).toFixed(2) + ' %' : '-'} </div>
      </SpaceBetweenRow>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Your Liquidity')}</div>
        <div>
          <AssetBalanceList assets={userLiquidity?.assets ?? []} hideSymbolIcon />
        </div>
      </SpaceBetweenRow>
    </Section>
  );
};
