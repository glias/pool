import WalletConnectProvider from '@walletconnect/web3-provider';
import { useConstant } from 'commons/use-constant';
import { Web3ModalAdapter } from 'commons/WalletAdapter';
import { BridgeAPI } from 'suite/api/bridgeAPI';
import { DummyGliaswapAPI } from 'suite/api/DummyGliaswapAPI';

export function useGlobalConfig() {
  const api = useConstant(() => new DummyGliaswapAPI());
  const bridgeAPI = useConstant(() => new BridgeAPI());

  const adapter = useConstant(
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
  );

  return { api, adapter, bridgeAPI };
}
