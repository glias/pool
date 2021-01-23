import React, { Suspense } from 'react';
import { Route, Switch } from 'react-router-dom';
import styled from 'styled-components';

const MainWrapper = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding-top: 16px;
`;

export const Main: React.FC = () => {
  return (
    <MainWrapper>
      <Suspense fallback={<div />}>
        <Switch>
          <Route path="/pool" component={React.lazy(() => import('./Pool'))} />
        </Switch>
      </Suspense>
    </MainWrapper>
  );
};
