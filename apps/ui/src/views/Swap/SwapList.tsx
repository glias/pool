import React from 'react';
import { List } from 'antd';
import { Block } from 'components/Block';
import { Title } from 'components/Title';
import i18n from 'i18n';
import { Order } from 'types';

export const SwapList: React.FC = () => {
  const data: Order[] = [];
  return (
    <Block>
      <Title>{i18n.t('swap.order-list.title')}</Title>
      <List
        bordered={false}
        dataSource={data}
        renderItem={(_order, _index) => {
          return <List.Item></List.Item>;
        }}
      />
    </Block>
  );
};
