import { AppHeader } from 'components/Header';
import React, { Suspense } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import styled from 'styled-components';
import Pool from 'views/Pool';
import Swap from 'views/Swap';
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
  margin: 0 auto;
  padding: 0 8px;
  margin-top: 16px;
`;

const Routers = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div />}>
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
    </BrowserRouter>
  );
};

export default Routers;
