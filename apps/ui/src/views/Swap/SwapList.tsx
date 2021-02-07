import React from 'react';
import { List } from 'antd';
import { Block } from 'components/Block';
import { SwapOrder } from '@gliaswap/commons';
import styled from 'styled-components';
import { useQuery } from 'react-query';
import { useGliaswap } from 'hooks';
import { useCallback, useMemo } from 'react';
import { SwapItem } from './SwapItem';
import { useSwapContainer } from './context';
import { useSwapOrders } from 'hooks/usePendingCancelOrders';
import { useState } from 'react';
import { OrderSelectorStatus, OrdersSelector } from 'components/OrdersSelector';

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

export const SwapList: React.FC = () => {
  const { currentUserLock, currentEthAddress } = useGliaswap();
  const { api } = useGliaswap();
  const { setAndCacheCrossChainOrders, crossChainOrders } = useSwapContainer();
  const { data, status } = useQuery(
    ['swap-list', currentUserLock, currentEthAddress],
    () => {
      return api.getSwapOrders(currentUserLock!, currentEthAddress);
    },
    {
      enabled: !!currentUserLock,
      refetchInterval: 5000,
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
  const matchedOrders = useMemo(() => {
    return orderSelectorStatus === OrderSelectorStatus.Pending ? pendingOrders : historyOrders;
  }, [orderSelectorStatus, pendingOrders, historyOrders]);

  const renderItem = useCallback((order: SwapOrder) => {
    return <SwapItem order={order} />;
  }, []);

  return (
    <Block>
      <OrdersSelector
        status={orderSelectorStatus}
        pendingOnClick={() => setOrderSelectorStatus(OrderSelectorStatus.Pending)}
        historyOnClick={() => setOrderSelectorStatus(OrderSelectorStatus.History)}
      />
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
