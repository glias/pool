import { SwapOrder } from '@gliaswap/commons';
import { Transaction } from '@lay2/pw-core';
import { useState } from 'react';
import { createContainer } from 'unstated-next';
import { TransactionConfig } from 'web3-core';

const useSwap = () => {
  const [cancelModalVisable, setCancelModalVisable] = useState(false);
  const [reviewModalVisable, setReviewModalVisable] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<SwapOrder>();
  const [currentCkbTx, setCurrentTx] = useState<Transaction>();
  const [currentEthTx, setCurrentEthTx] = useState<TransactionConfig>();

  return {
    cancelModalVisable,
    setCancelModalVisable,
    reviewModalVisable,
    setReviewModalVisable,
    currentOrder,
    setCurrentOrder,
    currentCkbTx,
    currentEthTx,
    setCurrentTx,
    setCurrentEthTx,
  };
};

export const SwapContainer = createContainer(useSwap);

export const SwapProvider = SwapContainer.Provider;

export const useSwapContainer = SwapContainer.useContainer;
