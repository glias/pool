import {
  CkbModel,
  EthModel,
  GliaswapAssetWithBalance,
  isCkbNativeAsset,
  isCkbSudtAsset,
  isEthErc20Asset,
  isEthNativeAsset,
  SwapOrder,
  SwapOrderType,
} from '@gliaswap/commons';
import PWCore, { Transaction } from '@lay2/pw-core';
import { Form } from 'antd';
import BigNumber from 'bignumber.js';
import { crossChainOrdersCache } from 'cache/index';
import { useGliaswap, useGliaswapAssets } from 'hooks';
import i18n from 'i18n';
import { cloneDeep } from 'lodash';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { MAX_TRANSACTION_FEE, SWAP_CELL_ASK_CAPACITY, SWAP_CELL_BID_CAPACITY } from 'suite/constants';
import { createContainer } from 'unstated-next';
import { TransactionConfig } from 'web3-core';

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

export type crossChainOrdersUpdateFn<T = Array<SwapOrder>> = (_: T) => T;

const usePrevious = <T extends unknown>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const useSwap = () => {
  const [cancelModalVisable, setCancelModalVisable] = useState(false);
  const [reviewModalVisable, setReviewModalVisable] = useState(false);
  const [stepModalVisable, setStepModalVisable] = useState(false);
  const [currentCkbTx, setCurrentTx] = useState<Transaction>();
  const { ckbNativeAsset } = useGliaswapAssets();
  const [currentEthTx, setCurrentEthTx] = useState<TransactionConfig>();
  const [tokenA, setTokenA] = useState<GliaswapAssetWithBalance>(Object.create(null) as GliaswapAssetWithBalance);
  const [tokenB, setTokenB] = useState<GliaswapAssetWithBalance>(Object.create(null) as GliaswapAssetWithBalance);
  const [pay, setPay] = useState('');
  const [receive, setReceive] = useState('');
  const { currentEthAddress: ethAddress, adapter, currentCkbAddress, realtimeAssets, bridgeAPI } = useGliaswap();
  const [crossChainOrders, setCrossChainOrders] = useState<Array<SwapOrder>>(
    crossChainOrdersCache.get(currentCkbAddress),
  );

  const previousPair = usePrevious({ tokenA, tokenB });

  useEffect(() => {
    if (adapter.status === 'connected' && currentCkbAddress) {
      setCrossChainOrders(crossChainOrdersCache.get(currentCkbAddress));
    } else {
      setCrossChainOrders([]);
    }
  }, [adapter.status, currentCkbAddress]);

  const { web3 } = adapter.raw;
  const swapMode = useMemo(() => {
    if (!tokenA || !tokenB) {
      return SwapMode.CrossChainOrder;
    }
    if (EthModel.isCurrentChainAsset(tokenA)) {
      if (CkbModel.isNativeAsset(tokenB)) {
        return SwapMode.CrossChainOrder;
      } else if (EthModel.isShadowEthAsset(tokenB) && EthModel.equals(tokenA, tokenB.shadowFrom)) {
        return SwapMode.CrossIn;
      } else {
        return SwapMode.CrossChainOrder;
      }
    }
    if (EthModel.isShadowEthAsset(tokenA)) {
      if (EthModel.isCurrentChainAsset(tokenB) && EthModel.equals(tokenA.shadowFrom, tokenB)) {
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

  const isWalletNotConnected = useMemo(() => {
    return adapter.status !== 'connected';
  }, [adapter.status]);

  const setAndCacheCrossChainOrders = useCallback(
    (updateFn: crossChainOrdersUpdateFn) => {
      if (isWalletNotConnected) {
        return;
      }
      setCrossChainOrders((orders) => {
        const latestAddress = PWCore.provider?.address?.toCKBAddress?.();
        // If address is not equal to the latest address
        // it is likely that this function was called before the wallet switch.
        if (latestAddress !== currentCkbAddress) {
          return orders;
        }
        const newOrders = updateFn(orders);
        crossChainOrdersCache.set(currentCkbAddress, newOrders);
        return newOrders;
      });
    },
    [currentCkbAddress, setCrossChainOrders, isWalletNotConnected],
  );

  const sendEthTransaction = useCallback(
    (tx: TransactionConfig, cb?: (txHash: string) => Promise<void>): Promise<string> => {
      if (!web3 || !ethAddress) {
        return Promise.resolve('');
      }
      delete tx.gasPrice;
      delete tx.nonce;

      return new Promise((resolve, reject) => {
        web3.eth
          .sendTransaction({
            ...tx,
            from: ethAddress,
          })
          .once('transactionHash', async (txHash) => {
            await cb?.(txHash);
            resolve(txHash);
          })
          .once('confirmation', (_, receipt) => {
            setAndCacheCrossChainOrders((orders) => {
              return orders.map((order) => {
                const txhash = order.stage.steps[0].transactionHash;
                if (
                  (order.type === SwapOrderType.CrossChainOrder || order.type === SwapOrderType.CrossChain) &&
                  receipt.transactionHash === txhash
                ) {
                  order.stage.steps[1] = cloneDeep(order.stage.steps[0]);
                }
                return order;
              });
            });
          })
          .on('error', (err) => reject(err));
      });
    },
    [web3, ethAddress, setAndCacheCrossChainOrders],
  );

  const isBid = useMemo(() => {
    return isCkbNativeAsset(tokenA);
  }, [tokenA]);

  const payMax = useMemo(() => {
    const decimal = new BigNumber(10).pow(tokenA.decimals);
    const token = realtimeAssets.value.find((a) => a.symbol === tokenA.symbol) ?? tokenA;
    const balance = new BigNumber(token.balance).div(decimal);
    if (balance.isNaN() || balance.isEqualTo(0)) {
      return '0';
    }
    if (isCkbNativeAsset(token)) {
      return balance
        .minus(isBid ? SWAP_CELL_BID_CAPACITY : SWAP_CELL_ASK_CAPACITY)
        .minus(MAX_TRANSACTION_FEE)
        .toString();
    } else if (isCkbSudtAsset(token)) {
      return balance.toString();
    } else if (isEthNativeAsset(token)) {
      const max = balance.minus(0.1);
      if (max.isNaN() || max.isLessThan(0)) {
        return '0';
      }
      return max.toString();
    }

    return balance.toString();
  }, [tokenA, realtimeAssets, isBid]);

  const isSendCkbTransaction = useMemo(() => {
    return swapMode === SwapMode.NormalOrder || swapMode === SwapMode.CrossOut;
  }, [swapMode]);

  const ckbEnoughMessage = useMemo(() => {
    if (swapMode === SwapMode.NormalOrder && ckbNativeAsset) {
      const cellSize = (isBid ? SWAP_CELL_BID_CAPACITY : SWAP_CELL_ASK_CAPACITY) + MAX_TRANSACTION_FEE;
      if (new BigNumber(ckbNativeAsset.balance).isLessThan(new BigNumber(cellSize).times(10 ** 8))) {
        return i18n.t('validation.ckb', { amount: cellSize });
      }
    }
    return '';
  }, [swapMode, isBid, ckbNativeAsset]);

  const [form] = Form.useForm();

  const resetForm = useCallback(() => {
    form.resetFields();
    setPay('');
    setReceive('');
  }, [form]);

  const [currentOrderTxHash, setCurrentOrderTxHash] = useState('');
  const [swapList, setSwapList] = useState<SwapOrder[]>([]);
  const currentOrder = useMemo(() => {
    return swapList.find((o) => o.stage.steps[0].transactionHash === currentOrderTxHash);
  }, [swapList, currentOrderTxHash]);

  return {
    cancelModalVisable,
    setCancelModalVisable,
    reviewModalVisable,
    setReviewModalVisable,
    stepModalVisable,
    setStepModalVisable,
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
    sendEthTransaction,
    setAndCacheCrossChainOrders,
    crossChainOrders,
    payMax,
    isBid,
    isSendCkbTransaction,
    ckbEnoughMessage,
    form,
    resetForm,
    currentOrder,
    setSwapList,
    setCurrentOrderTxHash,
    previousPair,
  };
};

export const SwapContainer = createContainer(useSwap);

export const SwapProvider = SwapContainer.Provider;

export const useSwapContainer = SwapContainer.useContainer;
