import { Asset, GliaswapAPI } from '@gliaswap/commons';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { message } from 'antd';
import { Provider as AdapterProvider, Web3ModalAdapter } from 'commons/WalletAdapter';
import { useConstant } from 'commons/use-constant';
import { Provider as AssetProvider } from 'contexts/GliaswapAssetContext';
import React, { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ServerGliaswapAPI } from 'suite/api/ServerGliaswapAPI';
import { BridgeAPI } from 'suite/api/bridgeAPI';

export const GliaswapProvider: React.FC = (props) => {
  const [api, setAPI] = useState<GliaswapAPI>(() => new ServerGliaswapAPI());
  const [address, setAddress] = useState<undefined | string>();
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const bridgeAPI = useConstant(() => BridgeAPI.getInstance());

  const adapter = useConstant(() => {
    return new Web3ModalAdapter({
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
    });
  });

  useEffect(() => {
    (async () => {
      const hide = message.loading('launching app...', 0);
      const list = await api.getAssetList();
      hide();
      setAssetList(list);
    })();

    adapter.on('connectStatusChanged', (status, signer) => {
      setAPI(new ServerGliaswapAPI(adapter.web3));
      setAddress(signer && signer.address);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queryClient = useMemo(() => {
    return new QueryClient();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AdapterProvider adapter={adapter}>
        {assetList.length > 0 ? (
          <AssetProvider address={address} api={api} assetList={assetList} bridgeAPI={bridgeAPI}>
            {props.children}
          </AssetProvider>
        ) : null}
      </AdapterProvider>
    </QueryClientProvider>
  );
};
