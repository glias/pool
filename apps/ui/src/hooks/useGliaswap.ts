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
import { addressToScript } from '@nervosnetwork/ckb-sdk-utils';
import { ConnectStatus, useWalletAdapter, Web3ModalAdapter } from 'commons/WalletAdapter';
import { AdapterContextState, ConnectedAdapterState } from 'commons/WalletAdapter/Provider';
import { AssetManagerState, RealtimeInfo, useGliaswapContext } from 'contexts/GliaswapAssetContext';
import { useMemo } from 'react';
import { BridgeAPI } from 'suite/api/bridgeAPI';

interface GliaswapState {
  adapter: AdapterContextState<Web3ModalAdapter>;

  /**
   * asserts is connected, get the connected adapter or throw an error if wallet is disconnected
   */
  assertsConnectedAdapter(): ConnectedAdapterState<Web3ModalAdapter>;

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

  currentCkbAddress: string;

  currentEthAddress: string;

  bridgeAPI: BridgeAPI;

  refreshAssetsWithBalance: AssetManagerState['refreshAssetsWithBalance'];
}

export function useGliaswap(): GliaswapState {
  const adapter = useWalletAdapter<Web3ModalAdapter>();
  const { assets, api, bridgeAPI, refreshAssetsWithBalance } = useGliaswapContext();

  const currentUserLock = useMemo(() => {
    if (adapter.status === 'connected') return addressToScript(adapter.signer.address);
    return undefined;
  }, [adapter.signer, adapter.status]);

  const currentCkbAddress = useMemo(() => {
    return adapter.signer?.address ?? '';
  }, [adapter.signer]);

  const currentEthAddress = useMemo(() => {
    if (!currentUserLock) return '';
    if (!adapter?.raw.web3?.utils) return currentUserLock.args;
    return adapter.raw.web3.utils.toChecksumAddress(currentUserLock.args);
  }, [adapter, currentUserLock]);

  function assertsConnectedAdapter(): ConnectedAdapterState<Web3ModalAdapter> {
    if (adapter.status !== 'connected') throw new Error('The wallet is not connected');
    return adapter;
  }

  return {
    adapter,
    assertsConnectedAdapter,
    realtimeAssets: assets,
    walletConnectStatus: adapter.status,
    api,
    currentUserLock,
    currentCkbAddress,
    currentEthAddress,
    bridgeAPI,
    refreshAssetsWithBalance,
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
