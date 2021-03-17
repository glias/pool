import { PoolInfoWithStatus } from '@gliaswap/commons';
import { Empty, Spin } from 'antd';
import { AssetBalanceList, PoolAssetSymbol } from 'components/Asset';
import { Section, SpaceBetweenRow } from 'components/Layout';
import i18n from 'i18n';
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
    padding: 4px 24px;
  }

  .liquidity-item {
    background: #fff;
    margin-bottom: 16px;
    cursor: pointer;

    .column-numerical,
    .column-symbol {
      font-size: 12px;
    }

    .asset-symbol {
      font-weight: bold;
    }

    &:first-child {
      margin-top: 0;
    }

    .symbol-text {
      display: block;
      width: 50px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
`;

interface LiquidityListProps {
  pools: PoolInfoWithStatus[];
}

export const LiquidityList: React.FC<LiquidityListProps> = (props) => {
  const history = useHistory();
  const pools = props.pools;

  return (
    <LiquidityListWrapper>
      <SpaceBetweenRow className="column-name">
        <div>{i18n.t('Asset')}</div>
        <div>{i18n.t('Liquidity')}</div>
      </SpaceBetweenRow>

      {pools.length <= 0 ? (
        <Empty style={{ color: '#fff' }}>{i18n.t('No liquidity found. Go to Explore Pool to add liquidity')}</Empty>
      ) : (
        pools.map(({ assets, poolId, status }) => (
          <Section
            key={poolId}
            className="liquidity-item"
            onClick={() => status === 'completed' && history.push(`/pool/${poolId}`)}
          >
            <Spin spinning={status === 'pending'}>
              <SpaceBetweenRow style={{ padding: 0, fontSize: '14px' }}>
                <div className="asset-symbol">
                  <PoolAssetSymbol assets={assets} />
                </div>
                <AssetBalanceList assets={assets} hideSymbolIcon />
              </SpaceBetweenRow>
            </Spin>
          </Section>
        ))
      )}
    </LiquidityListWrapper>
  );
};
