import { EthModel, Models, SwapOrder, SwapOrderType } from '@gliaswap/commons';
import { Checkbox, List } from 'antd';
import { Block } from 'components/Block';
import { OrderSelectorStatus, OrdersSelector } from 'components/OrdersSelector';
import { useGliaswap } from 'hooks';
import { useSwapOrders } from 'hooks/usePendingCancelOrders';
import i18n from 'i18n';
import { differenceWith } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useState } from 'react';
import React from 'react';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import styled from 'styled-components';
import { SwapItem } from './SwapItem';
import { useSwapContainer } from './context';

const ListContainer = styled.div`
  .ant-list-item {
    border-bottom: none;
    padding: 8px;
    &:nth-child(odd) {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
`;

export function normalizeTxHash(txhash?: string) {
  if (!txhash) {
    return '';
  }
  if (txhash.startsWith('0x')) {
    return txhash;
  }

  return `0x${txhash}`;
}

export function isSameTxHash(hash1?: string, hash2?: string) {
  if (!hash1 || !hash2) {
    return false;
  }

  return normalizeTxHash(hash1) === normalizeTxHash(hash2);
}

const Header = styled.header`
  display: flex;
  label {
    margin-left: auto;
    margin-top: 1px;
    font-size: 12px;
  }
`;

export const SwapList: React.FC = () => {
  const { currentUserLock, currentEthAddress } = useGliaswap();
  const { api } = useGliaswap();
  const { setAndCacheCrossChainOrders, crossChainOrders, setSwapList, tokenA, tokenB } = useSwapContainer();
  const { data, status } = useQuery(
    ['swap-list', currentUserLock, currentEthAddress],
    () => {
      return api.getSwapOrders(currentUserLock!, currentEthAddress);
    },
    {
      enabled: !!currentUserLock,
      refetchInterval: 10e3,
      refetchIntervalInBackground: true,
      onSuccess: (orders) => {
        setAndCacheCrossChainOrders((cacheOrders) => {
          return cacheOrders.filter((cache) => {
            const matched = orders.find((o) => o.stage?.steps?.[0]?.transactionHash === cache.transactionHash);
            return !matched;
          });
        });
      },
    },
  );

  const orderList = useMemo(() => {
    if (data) {
      return [...crossChainOrders, ...(data ?? [])];
    }
    return [...crossChainOrders, ...(data ?? [])];
  }, [data, crossChainOrders]);

  const { pendingOrders, historyOrders } = useSwapOrders(orderList);
  const [orderSelectorStatus, setOrderSelectorStatus] = useState(OrderSelectorStatus.Pending);
  const [currentPairOnly, setCurrentPairOnly] = useState(false);
  const pairFilter = useCallback(
    (order: SwapOrder) => {
      const currentPair = [tokenA, tokenB];
      const { amountIn, amountOut } = order;
      const pair = [
        EthModel.isShadowEthAsset(amountIn) && order.type === SwapOrderType.CrossChainOrder
          ? amountIn.shadowFrom
          : amountIn,
        EthModel.isShadowEthAsset(amountOut) && order.type === SwapOrderType.CrossChainOrder
          ? amountOut.shadowFrom
          : amountOut,
      ];
      return (
        differenceWith(currentPair, pair, (a, b) => {
          const model = Models.get(a.chainType);
          if (!model) return false;
          return model.isCurrentChainAsset(a) && model.isCurrentChainAsset(b) && model.equals(a, b);
        }).length === 0
      );
    },
    [tokenA, tokenB],
  );
  const matchedOrders = useMemo(() => {
    const orders = orderSelectorStatus === OrderSelectorStatus.Pending ? pendingOrders : historyOrders;
    return orders.filter(currentPairOnly ? pairFilter : Boolean);
  }, [orderSelectorStatus, pendingOrders, historyOrders, currentPairOnly, pairFilter]);

  useEffect(() => {
    setSwapList(matchedOrders);
  }, [matchedOrders, setSwapList]);

  const renderItem = useCallback((order: SwapOrder) => {
    return <SwapItem order={order} />;
  }, []);

  return (
    <Block>
      <Header>
        <OrdersSelector
          status={orderSelectorStatus}
          pendingOnClick={() => setOrderSelectorStatus(OrderSelectorStatus.Pending)}
          historyOnClick={() => setOrderSelectorStatus(OrderSelectorStatus.History)}
        />
        <Checkbox className="checkbox" checked={currentPairOnly} onChange={(e) => setCurrentPairOnly(e.target.checked)}>
          {i18n.t('Current pair')}
        </Checkbox>
      </Header>
      <ListContainer>
        <List
          pagination={{ position: 'bottom', size: 'small' }}
          bordered={false}
          dataSource={matchedOrders}
          loading={status === 'loading'}
          renderItem={renderItem}
        />
      </ListContainer>
    </Block>
  );
};
