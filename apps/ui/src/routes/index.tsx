import React, { Suspense } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { AppHeader } from 'components/Header';
import Pool from 'views/Pool';
import Swap from 'views/Swap';

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
    exact: true,
    component: Pool,
  },
];

const Routers = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div />}>
        <AppHeader />
        <Switch>
          {Containers.map((container) => {
            return <Route {...container} key={container.name} path={container.path} />;
          })}
          <Redirect from={RoutePath.Launch} exact to={RoutePath.Swap} />
        </Switch>
      </Suspense>
    </BrowserRouter>
  );
};

export default Routers;
