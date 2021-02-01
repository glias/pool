import { Col, Row } from 'antd';
import i18n from 'i18n';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { WalletConnectButton } from '../WalletConnectButton';
import { GlobalSetting } from './GlobalSetting';

const HeaderWrapper = styled.header`
  padding: 0 40px;
  background: #0d0d0d;

  .header {
    line-height: 60px;
  }

  .header-logo {
    color: #fff;
    font-size: 24px;
    font-weight: bold;
  }

  .header-nav {
    color: #fff;
    font-size: 14px;
    font-weight: 400;

    &-item {
      cursor: pointer;
    }

    &-activated {
      border-bottom: 2px solid #fff;
    }
  }

  .header-operation {
  }
`;

export const NavMenu: React.FC = () => {
  const location = useLocation();
  const history = useHistory();

  const [, key] = location.pathname.split('/');

  function onClick(selectedKey: string) {
    history.push(`/${selectedKey}`);
  }

  function getItemClass(navKey: string) {
    return `header-nav-item ${navKey === key ? 'header-nav-activated' : ''}`;
  }

  return (
    <Row justify="center" gutter={16}>
      <Col className={getItemClass('swap')} onClick={() => onClick('swap')}>
        {i18n.t('Swap')}
      </Col>
      <Col className={getItemClass('pool')} onClick={() => onClick('pool')}>
        {i18n.t('Pool')}
      </Col>
    </Row>
  );
};

export const AppHeader: React.FC = () => {
  return (
    <HeaderWrapper>
      <Row wrap={false} className="header" justify="center">
        <Col md={4} className="header-logo">
          Pool
        </Col>
        <Col flex="auto" className="header-nav">
          <NavMenu />
        </Col>
        <Col md={4} className="header-operation">
          <WalletConnectButton />
          &nbsp;&nbsp;
          <GlobalSetting />
        </Col>
      </Row>
    </HeaderWrapper>
  );
};
