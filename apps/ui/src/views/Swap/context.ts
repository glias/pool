import {
  GliaswapAssetWithBalance,
  isCkbAsset,
  isCkbNativeAsset,
  isEthAsset,
  isEthErc20Asset,
  isShadowEthAsset,
  SwapOrder,
} from '@gliaswap/commons';
import { Transaction } from '@lay2/pw-core';
import { useGliaswap } from 'contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createContainer } from 'unstated-next';
import { TransactionConfig } from 'web3-core';
import { useGlobalConfig } from 'contexts/config';

export enum SwapMode {
  CrossIn = 'CrossIn',
  CrossOut = 'CrossOut',
  CrossChainOrder = 'CrossChainOrder',
  NormalOrder = 'NormalOrder',
}

export enum ApproveStatus {
  Init = 'Init',
  Signing = 'Signing',
  Confirming = 'Confirming',
  Finish = 'Finish',
}

const useSwap = () => {
  const [cancelModalVisable, setCancelModalVisable] = useState(false);
  const [reviewModalVisable, setReviewModalVisable] = useState(false);
  const [stepModalVisable, setStepModalVisable] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<SwapOrder>();
  const [currentCkbTx, setCurrentTx] = useState<Transaction>();
  const [currentEthTx, setCurrentEthTx] = useState<TransactionConfig>();
  const [tokenA, setTokenA] = useState<GliaswapAssetWithBalance>(Object.create(null) as GliaswapAssetWithBalance);
  const [tokenB, setTokenB] = useState<GliaswapAssetWithBalance>(Object.create(null) as GliaswapAssetWithBalance);
  const [pay, setPay] = useState('');
  const [receive, setReceive] = useState('');
  const { currentEthAddress: ethAddress, adapter } = useGliaswap();
  const { bridgeAPI } = useGlobalConfig();
  const { web3 } = adapter.raw;
  const swapMode = useMemo(() => {
    if (!tokenA || !tokenB) {
      return SwapMode.CrossChainOrder;
    }
    if (isEthAsset(tokenA)) {
      if (isCkbNativeAsset(tokenB)) {
        return SwapMode.CrossChainOrder;
      } else if (isShadowEthAsset(tokenB)) {
        return SwapMode.CrossIn;
      }
    }
    if (isCkbAsset(tokenA)) {
      if (isEthAsset(tokenB)) {
        return SwapMode.CrossOut;
      }
    }
    return SwapMode.NormalOrder;
  }, [tokenA, tokenB]);

  const togglePair = useCallback(() => {
    setTokenA(tokenB);
    setTokenB(tokenA);
  }, [tokenA, tokenB]);

  const currentERC20 = useMemo(() => {
    if (isEthErc20Asset(tokenA)) {
      return tokenA;
    }
    if (isEthErc20Asset(tokenB)) {
      return tokenB;
    }
    return null;
  }, [tokenA, tokenB]);

  const [shouldApprove, setShouldApprove] = useState(false);
  const [approveStatues, setApproveStatus] = useState<Record<string, ApproveStatus>>({});

  useEffect(() => {
    if (currentERC20) {
      if (web3 && ethAddress) {
        bridgeAPI.getAllowanceForTarget(ethAddress, currentERC20.address, web3).then((res) => {
          if (res === '0') {
            setShouldApprove(true);
          } else {
            setShouldApprove(false);
          }
        });
      }
    } else {
      setShouldApprove(false);
    }
  }, [currentERC20, web3, ethAddress, bridgeAPI]);

  const setERC20ApproveStatus = useCallback((address: string, status: ApproveStatus) => {
    setApproveStatus((prev) => {
      return {
        ...prev,
        [address]: status,
      };
    });
  }, []);

  const currentApproveStatus: ApproveStatus = useMemo(() => {
    if (!currentERC20) {
      return ApproveStatus.Init;
    }
    return approveStatues[currentERC20?.address] ?? ApproveStatus.Init;
  }, [currentERC20, approveStatues]);

  const isApproving = useMemo(() => {
    return currentApproveStatus === ApproveStatus.Signing || currentApproveStatus === ApproveStatus.Confirming;
  }, [currentApproveStatus]);

  const approveText = useMemo(() => {
    switch (currentApproveStatus) {
      case ApproveStatus.Init:
        return `Approve ${currentERC20?.symbol}`;
      case ApproveStatus.Signing:
        return `Approving in Wallet`;
      case ApproveStatus.Confirming:
        return `Approving on Chain`;
      default:
        return `Approve ${currentERC20?.symbol}`;
    }
  }, [currentApproveStatus, currentERC20]);

  const approveERC20 = useCallback(() => {
    if (ethAddress && web3 && currentERC20) {
      const address = currentERC20.address;
      setERC20ApproveStatus(address, ApproveStatus.Signing);
      bridgeAPI
        .approveERC20ToBridge(ethAddress, currentERC20.address, web3, () =>
          setERC20ApproveStatus(address, ApproveStatus.Confirming),
        )
        .then(() => {
          setERC20ApproveStatus(address, ApproveStatus.Finish);
          setShouldApprove(false);
        })
        .catch(() => {
          setERC20ApproveStatus(address, ApproveStatus.Init);
        });
    }
  }, [setERC20ApproveStatus, web3, currentERC20, bridgeAPI, ethAddress]);

  return {
    cancelModalVisable,
    setCancelModalVisable,
    reviewModalVisable,
    setReviewModalVisable,
    stepModalVisable,
    setStepModalVisable,
    currentOrder,
    setCurrentOrder,
    currentCkbTx,
    currentEthTx,
    setCurrentTx,
    setCurrentEthTx,
    tokenA,
    tokenB,
    swapMode,
    setTokenA,
    setTokenB,
    pay,
    receive,
    setPay,
    setReceive,
    togglePair,
    shouldApprove,
    approveERC20,
    approveText,
    isApproving,
  };
};

export const SwapContainer = createContainer(useSwap);

export const SwapProvider = SwapContainer.Provider;

export const useSwapContainer = SwapContainer.useContainer;
