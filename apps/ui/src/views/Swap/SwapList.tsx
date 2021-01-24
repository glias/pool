import React from 'react';
import { List } from 'antd';
import { Block } from 'components/Block';
import { Title } from 'components/Title';
import i18n from 'i18n';
import { SwapOrder } from '@gliaswap/commons';
import styled from 'styled-components';
import { useQuery } from 'react-query';
import { useGliaswap } from 'contexts';
import { useGlobalConfig } from 'contexts/config';
import { useCallback } from 'react';
import { SwapItem } from './SwapItem';

const ListContainer = styled.div`
  .ant-list-item {
    border-bottom: none;
    padding: 8px;
    &:nth-child(odd) {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }
`;

export const SwapList: React.FC = () => {
  const { currentUserLock } = useGliaswap();
  const { api } = useGlobalConfig();
  const { data, status } = useQuery(
    ['swap-list', currentUserLock],
    () => {
      return api.getSwapOrders();
    },
    {
      enabled: !!currentUserLock,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  );
  const renderItem = useCallback((order: SwapOrder) => {
    return <SwapItem order={order} />;
  }, []);
  return (
    <Block>
      <Title>{i18n.t('swap.order-list.title')}</Title>
      <ListContainer>
        <List
          pagination={{ position: 'bottom' }}
          bordered={false}
          dataSource={data}
          loading={status === 'loading'}
          renderItem={renderItem}
        />
      </ListContainer>
    </Block>
  );
};
