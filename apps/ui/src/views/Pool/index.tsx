import React, { useEffect } from 'react';
import { Route, Switch, useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import LiquidityExplorer from './LiquidityExplorer';
import { PoolDetail } from './PoolDetail';

const PoolView: React.FC = () => {
  const match = useRouteMatch();
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (location.pathname !== '/pool') return;
    history.replace('/pool/explorer');
  }, [location, history]);

  return (
    <Switch>
      <Route path={`${match.path}/explorer`} component={LiquidityExplorer} />
      <Route path={`${match.path}/:poolId`} component={PoolDetail} />
    </Switch>
  );
};

export default PoolView;
