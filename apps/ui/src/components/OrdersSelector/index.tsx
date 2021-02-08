import React from 'react';
import styled from 'styled-components';
import { Dropdown, Menu } from 'antd';
import { Title } from 'components/Title';
import { ReactComponent as TriangleSvg } from 'assets/svg/triangle.svg';
import i18n from 'i18n';

const MenuContainer = styled(Menu)``;

const DropdropContainer = styled.a`
  h2 {
    svg {
      margin-left: 8px;
    }
  }
`;

export enum OrderSelectorStatus {
  Pending,
  History,
}

export interface OrdersSelectorProps {
  status: OrderSelectorStatus;
  pendingOnClick?: () => void;
  historyOnClick?: () => void;
  extra?: React.ReactNode;
}

export const OrdersSelector: React.FC<OrdersSelectorProps> = ({ status, pendingOnClick, historyOnClick, extra }) => {
  const pendingText = i18n.t('common.pending-requests');
  const historyText = i18n.t('common.history-orders');

  const menu = (
    <MenuContainer>
      {status === OrderSelectorStatus.History ? <Menu.Item onClick={pendingOnClick}>{pendingText}</Menu.Item> : null}
      {status === OrderSelectorStatus.Pending ? <Menu.Item onClick={historyOnClick}>{historyText}</Menu.Item> : null}
    </MenuContainer>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <DropdropContainer onClick={(e) => e.preventDefault()}>
        <Title>
          {status === OrderSelectorStatus.History ? historyText : null}
          {status === OrderSelectorStatus.Pending ? pendingText : null}
          <TriangleSvg />
          {extra}
        </Title>
      </DropdropContainer>
    </Dropdown>
  );
};
