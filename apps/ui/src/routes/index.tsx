import React, { Suspense, useState } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { AppHeader } from 'components/Header';
import styled from 'styled-components';
import Pool from 'views/Pool';
import Swap from 'views/Swap';
import { Input, Button, Modal } from 'antd';

const TEMP_PASSWORD = `gliaswap`;

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
  const [entryPassword, setEntryPassword] = useState('');
  const [modalVisable, setModalVisable] = useState(localStorage.getItem(TEMP_PASSWORD) !== TEMP_PASSWORD);

  const modalFooter = (
    <Button
      type="primary"
      disabled={entryPassword !== TEMP_PASSWORD}
      onClick={() => {
        setModalVisable(false);
        localStorage.setItem(TEMP_PASSWORD, TEMP_PASSWORD);
      }}
    >
      Unlock
    </Button>
  );

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
        <Modal visible={modalVisable} keyboard={false} closable={false} footer={modalFooter}>
          <div>
            <h3>Please enter the Internal Test Code:</h3>
            <Input value={entryPassword} type="password" onChange={(e) => setEntryPassword(e.target.value)} />
            <div style={{ marginTop: '8px' }}>
              The Demo App is currently under internal testing, so please be aware of the risks when trading your
              assets. If you have any questions or suggestions when testing, please submit a issue at&nbsp;
              <a
                style={{ color: 'blue' }}
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/glias/pool/issues"
              >
                GitHub
              </a>
              .
            </div>
          </div>
        </Modal>
      </Suspense>
    </BrowserRouter>
  );
};

export default Routers;
