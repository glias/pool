import { LiquidityInfo } from '@gliaswap/commons';
import { Empty } from 'antd';
import { AssetBalanceList, PoolAssetSymbol } from 'components/Asset/AssetBlanaceList';
import { Section, SpaceBetweenRow } from 'components/Layout';
import i18n from 'i18next';
import React from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

const LiquidityListWrapper = styled.div`
  .column-name {
    font-weight: bold;
    font-size: 12px;
    line-height: 14px;
    text-align: center;
    color: #fff;
  }

  .liquidity-item {
    background: #fff;
    margin-bottom: 16px;
    cursor: pointer;

    .asset-symbol {
      font-weight: bold;
    }
  }
`;

interface LiquidityListProps {
  pools: LiquidityInfo[];
}

export const LiquidityList: React.FC<LiquidityListProps> = (props) => {
  const history = useHistory();
  const pools = props.pools;

  return (
    <LiquidityListWrapper>
      <Section transparent>
        <SpaceBetweenRow className="column-name">
          <div>Asset</div>
          <div>Liquidity</div>
        </SpaceBetweenRow>
      </Section>

      {pools.length <= 0 && <Empty>{i18n.t('No liquidity found. Go to Explore Pool to add liquidity')}</Empty>}

      {pools.length &&
        pools.map(({ assets, poolId }) => (
          <Section key={poolId} className="liquidity-item" onClick={() => history.push(`/pool/${poolId}`)}>
            <SpaceBetweenRow>
              <div className="asset-symbol">
                <PoolAssetSymbol assets={assets} />
              </div>
              <AssetBalanceList assets={assets} />
            </SpaceBetweenRow>
          </Section>
        ))}
    </LiquidityListWrapper>
  );
};
