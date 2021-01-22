import { Menu } from 'antd';
import i18n from 'i18n';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { WalletConnectButton } from '../WalletConnectButton';
import { GlobalSetting } from './GlobalSetting';

const HeaderWrapper = styled.header`
  height: 60px;
  display: flex;
  padding: 0 40px;
  justify-content: space-between;
  background: #0d0d0d;
  align-items: center;

  .ant-menu-horizontal {
    line-height: 59px;
  }
`;

export const NavMenu: React.FC = () => {
  const location = useLocation();
  const history = useHistory();

  const [, key] = location.pathname.split('/');

  function onClick(selectedKey: string) {
    history.push(`/${selectedKey}`);
  }

  return (
    <Menu theme="dark" onClick={(x) => onClick(x.key as string)} selectedKeys={[key]} mode="horizontal">
      <Menu.Item key="swap">{i18n.t('Swap')}</Menu.Item>
      <Menu.Item key="pool">{i18n.t('Pool')}</Menu.Item>
    </Menu>
  );
};

export const AppHeader: React.FC = () => {
  return (
    <HeaderWrapper>
      <div style={{ fontSize: '24px', color: '#fff', fontWeight: 'bold' }}>Pool</div>
      <div>
        <NavMenu />
      </div>
      <div>
        <WalletConnectButton />
        <GlobalSetting />
      </div>
    </HeaderWrapper>
  );
};
