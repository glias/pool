import WalletConnectProvider from '@walletconnect/web3-provider';
import { AppHeader } from 'components/Header';
import { Provider as AssetProvider } from 'hooks/use-asset';
import { Provider as AdapterProvider, Web3ModalAdapter } from 'hooks/use-wallet-adapter';
import React, { useEffect, useMemo } from 'react';
import { BrowserRouter, useHistory, useLocation } from 'react-router-dom';
import { Main } from 'views';
import './App.less';

const AppContent = () => {
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    const [, currentModule] = location.pathname.split('/');
    if (!currentModule) history.replace('/swap');
  }, [location.pathname, history]);

  return (
    <>
      <AppHeader />
      <Main />
    </>
  );
};

const App: React.FC = () => {
  const adapter = useMemo(
    () =>
      new Web3ModalAdapter({
        ckbNodeUrl: process.env.REACT_APP_CKB_NODE_URL,
        ckbChainId: Number(process.env.REACT_APP_CKB_CHAIN_ID),
        web3ModalOptions: {
          network: process.env.REACT_APP_ETH_NETWORK,
          providerOptions: {
            walletconnect: {
              package: WalletConnectProvider,
              options: { infuraId: process.env.REACT_APP_INFURA_ID },
            },
          },
        },
      }),
    [],
  );

  return (
    <AdapterProvider adapter={adapter}>
      <AssetProvider erc20List={[]} sudtList={[]}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AssetProvider>
    </AdapterProvider>
  );
};

export default App;
