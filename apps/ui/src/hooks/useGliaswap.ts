import {
  CkbNativeAssetWithBalance,
  CkbSudtAssetWithBalance,
  EthErc20AssetWithBalance,
  EthNativeAssetWithBalance,
  GliaswapAPI,
  GliaswapAssetWithBalance,
  isCkbAsset,
  isCkbNativeAsset,
  isCkbSudtAsset,
  isEthAsset,
  isEthErc20Asset,
  isEthNativeAsset,
  isShadowEthAsset,
  Script,
  ShadowFromEthWithBalance,
} from '@gliaswap/commons';
import { ConnectStatus, useWalletAdapter, Web3ModalAdapter } from 'commons/WalletAdapter';
import { AdapterContextState } from 'commons/WalletAdapter/Provider';
import { RealtimeInfo, useGliaswapContext } from 'contexts/GliaswapAssetContext';
import { useMemo } from 'react';

interface GliaswapState {
  /**
   * the WalletConnectAdapter
   * @see {AdapterContextState}
   */
  adapter: AdapterContextState<Web3ModalAdapter>;
  // global assets info with balance
  realtimeAssets: RealtimeInfo<GliaswapAssetWithBalance[]>;
  /**
   * an implement of GliaswapAPI
   * @see {GliaswapAPI}
   */
  api: GliaswapAPI;
  // wallet connect status
  walletConnectStatus: ConnectStatus;
  // when a wallet was connected, the user lock would be filled
  currentUserLock?: Script;
}

export function useGliaswap(): GliaswapState {
  const adapter = useWalletAdapter<Web3ModalAdapter>();
  const { assets, api } = useGliaswapContext();

  const currentUserLock = useMemo(() => {
    if (adapter.status === 'connected') return adapter.signer.address.toLockScript();
    return undefined;
  }, [adapter.signer.address, adapter.status]);
  const walletConnectStatus = adapter.status;

  return {
    adapter,
    realtimeAssets: assets,
    walletConnectStatus,
    api,
    currentUserLock,
  };
}

export interface GliaswapAssets {
  ckbAssets: (CkbNativeAssetWithBalance | CkbSudtAssetWithBalance)[];
  ckbNativeAsset: CkbNativeAssetWithBalance | undefined;
  ckbSudtAssets: CkbSudtAssetWithBalance[];

  shadowEthAssets: ShadowFromEthWithBalance[];

  ethAssets: (EthNativeAssetWithBalance | EthErc20AssetWithBalance)[];
  ethNativeAsset: EthNativeAssetWithBalance | undefined;
  ethErc20Assets: EthErc20AssetWithBalance[];
}

export function useGliaswapAssets(): GliaswapAssets {
  const { realtimeAssets: assets } = useGliaswap();

  return useMemo(() => {
    const ckbAssets = assets.value.filter(isCkbAsset);
    const ckbNativeAsset = ckbAssets.find(isCkbNativeAsset) as CkbNativeAssetWithBalance | undefined;
    const ckbSudtAssets = ckbAssets.filter(isCkbSudtAsset);

    const shadowEthAssets = ckbSudtAssets.filter(isShadowEthAsset);

    const ethAssets = assets.value.filter(isEthAsset);
    const ethNativeAsset = ethAssets.find(isEthNativeAsset) as EthNativeAssetWithBalance | undefined;
    const ethErc20Assets = ethAssets.filter(isEthErc20Asset);

    return { ckbAssets, ckbNativeAsset, ckbSudtAssets, ethAssets, ethNativeAsset, ethErc20Assets, shadowEthAssets };
  }, [assets]);
}
