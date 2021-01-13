import WalletConnectProvider from '@walletconnect/web3-provider';
import { Asset, AssetWithBalance, Provider as AssetProvider, useAsset } from 'commons/MultiAsset';
import { Provider as AdapterProvider, useAdapter, Web3ModalAdapter } from 'commons/WalletAdapter';
import { QueryClientProvider, QueryClient } from 'react-query';
import React, { useMemo } from 'react';

export const GliaswapProvider: React.FC = (props) => {
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

  const queryClient = useMemo(() => {
    return new QueryClient();
  }, []);

  async function onStatefulAssetUpdate(assets: Asset[]): Promise<AssetWithBalance[]> {
    return [];
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AdapterProvider adapter={adapter}>
        <AssetProvider onStatefulAssetUpdate={onStatefulAssetUpdate} assetList={[]}>
          {props.children}
        </AssetProvider>
      </AdapterProvider>
    </QueryClientProvider>
  );
};

export function useGliaswap() {
  const adapter = useAdapter<Web3ModalAdapter>();
  const { assets } = useAsset<AssetWithBalance>();

  return { adapter, assets };
}
