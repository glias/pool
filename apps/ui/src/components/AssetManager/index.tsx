import { AssetBalance } from 'components/AssetManager/AssetBalance';
import { AssetDetail } from 'components/AssetManager/AssetsDetail';
import { Provider as AssetManagerProvider, useAssetManager } from 'components/AssetManager/hooks';
import { Receive } from 'components/AssetManager/Receive';
import { Send } from 'components/AssetManager/Send';
import { useGliaswap } from 'hooks';
import React, { useEffect, useMemo } from 'react';
import { MemoryRouter, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { CKB_NATIVE_TYPE_HASH } from 'suite';
import { SendConfirm } from './Send/Confirm';
import { TransactionDetail } from './TransactionDetail';

const Control = () => {
  const { pathname } = useLocation();
  const { replace } = useHistory();
  const { setTypeHash } = useAssetManager();

  const typeHash = useMemo(() => {
    const typeHashParam = pathname.split('/');
    return typeHashParam[2];
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/') replace('/assets');
  }, [pathname, replace]);

  useEffect(() => {
    if (!typeHash) return setTypeHash(CKB_NATIVE_TYPE_HASH);
    setTypeHash(typeHash);
  }, [typeHash, setTypeHash]);

  return (
    <>
      <Switch>
        <Route exact path="/assets" component={AssetBalance} />
        <Route exact path="/assets/:tokenName" component={AssetDetail} />
        <Route exact path="/assets/:tokenName/receive" component={Receive} />
        <Route exact path="/assets/:tokenName/send" component={Send} />
        <Route exact path="/assets/:tokenName/send/confirm" component={SendConfirm} />
        <Route exact path="/assets/:tokenName/transactions/:txHash" component={TransactionDetail} />
      </Switch>
    </>
  );
};

const AssetManagerWrapper = styled.div`
  width: 375px;
  height: 675px;
  overflow-y: auto;
`;

export const AssetManager: React.FC = () => {
  const { adapter } = useGliaswap();
  if (adapter.status !== 'connected') {
    return null;
  }

  return (
    <AssetManagerWrapper>
      <MemoryRouter>
        <AssetManagerProvider>
          <Control />
        </AssetManagerProvider>
      </MemoryRouter>
    </AssetManagerWrapper>
  );
};
