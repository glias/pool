import { CloseOutlined } from '@ant-design/icons';
import { AppHeader } from 'components/Header';
import { UIEnvs } from 'envs';
import React, { Suspense } from 'react';
import { useState } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import styled from 'styled-components';
import Pool from 'views/Pool';
import Swap from 'views/Swap';
import { ChainIDWarningModal } from './ChainIDWanringModal';
import { ProtectionModal } from './ProtectionModal';

export enum RoutePath {
  Launch = '/',
  Swap = '/swap',
  Pool = '/pool',
}

const Containers = [
  {
    name: 'Swap',
    path: RoutePath.Swap,
    exact: true,
    component: Swap,
  },
  {
    name: 'Pool',
    path: RoutePath.Pool,
    exact: false,
    component: Pool,
  },
];

const MainWrapper = styled.div`
  max-width: 516px;
  padding: 0 8px;
  margin: 16px auto 0;
`;

const Banner = styled.div`
  background-color: #212121;
  position: relative;
  width: 100%;
  margin: 0 auto;
  height: 60px;
  display: flex;
  justify-content: center;
  color: white;
  align-items: center;
  font-size: 12px;
  @media (max-width: 600px) {
    height: 100px;
    padding: 15px;
  }
  .content {
    div {
      text-align: center;
    }
    a {
      color: #5c61da;
      text-decoration: underline;
    }
    .close {
      cursor: pointer;
      position: absolute;
      top: 20px;
      right: 30px;
      @media (max-width: 600px) {
        top: 10px;
        right: 15px;
      }
    }
  }
`;

const Routers = () => {
  const [showBanner, setShowBanner] = useState(true);
  return (
    <BrowserRouter>
      <Suspense fallback={<div />}>
        {showBanner ? (
          <Banner>
            <div className="content">
              <div>
                Gliaswap is an AMM DEX Demo developed by Nervos Team, currently deployed on CKB Aggron testnet and
                Ethereum Rinkeby testnet.
              </div>
              <div>
                <a target="_blank" rel="noreferrer noopener" href={UIEnvs.get('FAUCET_URL')}>
                  Claim some Test Token
                </a>
                &nbsp;before you start trading. Use at your own risk.
              </div>
              <span className="close">
                <CloseOutlined onClick={() => setShowBanner(false)} />
              </span>
            </div>
          </Banner>
        ) : null}
        <AppHeader />
        <MainWrapper>
          <Switch>
            {Containers.map((container) => {
              return <Route {...container} key={container.name} path={container.path} />;
            })}
            <Redirect exact from={RoutePath.Launch} to={RoutePath.Swap} />
          </Switch>
        </MainWrapper>
      </Suspense>
      <ProtectionModal />
      <ChainIDWarningModal />
    </BrowserRouter>
  );
};

export default Routers;
