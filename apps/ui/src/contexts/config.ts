import { GliaswapAPI } from '@gliaswap/commons';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { useConstant } from 'commons/use-constant';
import { Web3ModalAdapter } from 'commons/WalletAdapter';
import { ServerGliaswapAPI } from 'suite/api/ServerGliaswapAPI';

export function useGlobalConfig() {
  const api: GliaswapAPI = useConstant(() => new ServerGliaswapAPI());

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

  return { api, adapter };
}
