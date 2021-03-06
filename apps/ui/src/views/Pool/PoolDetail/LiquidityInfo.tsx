import { Empty, Skeleton, Tag, Typography } from 'antd';
import { AssetBalanceList, PoolAssetSymbol } from 'components/Asset';
import { HumanizeBalance } from 'components/Balance';
import { Section, SpaceBetweenRow } from 'components/Layout';
import { useLiquidityDetail } from 'hooks/useLiquidityDetail';
import i18n from 'i18n';
import React from 'react';
import { Link } from 'react-router-dom';
import { truncateMiddle } from 'utils';

const { Text } = Typography;

interface LiquidityInfoProps {
  poolId: string;
}

export const UserLiquidityInfo: React.FC = () => {
  const { userLiquidityQuery } = useLiquidityDetail();
  const userLiquidity = userLiquidityQuery.data;

  if (!userLiquidity) return null;

  return (
    <>
      <SpaceBetweenRow>
        <div className="label">{i18n.t('Your LP Token')}</div>
        <div>{userLiquidity.lpToken ? <HumanizeBalance asset={userLiquidity.lpToken} /> : '-'}</div>
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
    </>
  );
};

export const LiquidityInfo: React.FC<LiquidityInfoProps> = ({ poolId }) => {
  const { poolLiquidityQuery } = useLiquidityDetail();

  if (poolLiquidityQuery.isLoading) {
    return (
      <Section>
        <Skeleton active />
      </Section>
    );
  }

  const poolLiquidity = poolLiquidityQuery.data;

  if (!poolLiquidity)
    return (
      <Section>
        <Empty description={<Text type="secondary">{i18n.t('The pool is not exists')}</Text>} />
      </Section>
    );

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
          <Link to={`/pool/${poolId}`}>{truncateMiddle(poolId)}</Link>
        </div>
      </SpaceBetweenRow>
      <UserLiquidityInfo />
    </Section>
  );
};
