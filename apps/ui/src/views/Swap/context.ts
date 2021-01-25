import {
  GliaswapAssetWithBalance,
  isCkbAsset,
  isCkbNativeAsset,
  isEthAsset,
  isShadowEthAsset,
  SwapOrder,
} from '@gliaswap/commons';
import { Transaction } from '@lay2/pw-core';
import { useCallback, useMemo, useState } from 'react';
import { createContainer } from 'unstated-next';
import { TransactionConfig } from 'web3-core';

export enum SwapMode {
  CrossIn = 'CrossIn',
  CrossOut = 'CrossOut',
  CrossChainOrder = 'CrossChainOrder',
  NormalOrder = 'NormalOrder',
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
  };
};

export const SwapContainer = createContainer(useSwap);

export const SwapProvider = SwapContainer.Provider;

export const useSwapContainer = SwapContainer.useContainer;
