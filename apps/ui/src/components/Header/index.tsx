import { Col, Row } from 'antd';
import i18n from 'i18n';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { WalletConnectButton } from '../WalletConnectButton';
import { GlobalSetting } from './GlobalSetting';

const HeaderWrapper = styled.header`
  padding: 0 40px;
  background: #0d0d0d;

  @media (max-width: 500px) {
    padding: 0 8px;
  }

  .header {
    line-height: 60px;
    @media (max-width: 500px) {
      line-height: 45px;
    }
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
    min-width: 200px;
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

function useWidth(elementRef: React.RefObject<HTMLElement>) {
  const [width, setWidth] = useState<number>();

  const updateWidth = useCallback(() => {
    if (elementRef && elementRef.current) {
      const { width } = elementRef.current.getBoundingClientRect();
      setWidth(width);
    }
  }, [elementRef]);

  useEffect(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, [updateWidth]);

  return [width];
}

export const AppHeader: React.FC = () => {
  const headerRef = useRef(null);
  const [width] = useWidth(headerRef);
  const isMobile = width && width < 500;
  return (
    <HeaderWrapper ref={headerRef}>
      <Row wrap={false} className="header" justify="center">
        <Col md={4} className="header-logo">
          GLIASWAP
        </Col>
        <Col flex="auto" className="header-nav">
          {isMobile ? null : <NavMenu />}
        </Col>
        <Col md={4} className="header-operation">
          <WalletConnectButton />
          &nbsp;&nbsp;
          <GlobalSetting />
        </Col>
      </Row>
      {isMobile ? (
        <Row wrap={false} className="header" justify="center">
          <Col flex="auto" className="header-nav">
            <NavMenu />
          </Col>
        </Row>
      ) : null}
    </HeaderWrapper>
  );
};
