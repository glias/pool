import React from 'react';
import { List } from 'antd';
import { Block } from 'components/Block';
import { Title } from 'components/Title';
import i18n from 'i18n';
import { SwapOrder } from '@gliaswap/commons';
import styled from 'styled-components';
import { TableRow } from 'components/TableRow';
import { formatTimestamp } from 'utils';

const ItemContainer = styled.div``;

const SwapItem = ({ order }: { order: SwapOrder }) => {
  const timestamp = formatTimestamp(order.timestamp);
  return (
    <List.Item>
      <ItemContainer>
        <TableRow label={i18n.t('swap.order-list.time')} value={timestamp} />
        <TableRow label={i18n.t('swap.order-list.route')} value="" />
        <TableRow label={i18n.t('swap.order-list.pay')} value="" />
        <TableRow label={i18n.t('swap.order-list.receive')} value="" />
      </ItemContainer>
    </List.Item>
  );
};

export const SwapList: React.FC = () => {
  const data: SwapOrder[] = [];
  return (
    <Block>
      <Title>{i18n.t('swap.order-list.title')}</Title>
      <List
        bordered={false}
        dataSource={data}
        renderItem={(order) => {
          return (
            <List.Item>
              <SwapItem order={order} />
            </List.Item>
          );
        }}
      />
    </Block>
  );
};
