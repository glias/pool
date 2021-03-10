import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import { RoutePath } from 'routes';
import { CreatePool } from './CreatePool';
import LiquidityExplorer from './LiquidityExplorer';
import { PoolDetail } from './PoolDetail';

const PoolView: React.FC = () => {
  const match = useRouteMatch();

  return (
    <Switch>
      <Route path={`${match.path}/explorer`} component={LiquidityExplorer} />
      <Route path={`${match.path}/:poolId`} component={PoolDetail} />
      <Redirect from={RoutePath.Pool} exact to={`${match.path}/explorer`} />
    </Switch>
  );
};

export default PoolView;
