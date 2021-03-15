import {
  CkbAssetWithBalance,
  CkbModel,
  CkbSudtAssetWithBalance,
  EthErc20AssetWithBalance,
  EthModel,
  GliaswapAssetWithBalance,
  isCkbAsset,
  isCkbNativeAsset,
  isCkbSudtAsset,
  isEthAsset,
  isShadowEthAsset,
  ShadowFromEthWithBalance,
} from '@gliaswap/commons';
import { FormInstance } from 'antd/lib/form';
import { RealtimeInfo } from 'contexts/GliaswapAssetContext';
import { useGliaswap, useGliaswapAssets } from 'hooks';
import { useLiquidityPoolInfo } from 'hooks/useLiquidityPool';
import { differenceWith } from 'lodash';
import { useState } from 'react';
import { useMemo, useEffect, useCallback } from 'react';
import { SwapMode, useSwapContainer } from '../context';
import { calcBalance, calcPrice, calcPriceImpact, toStringNumberOrZero } from './fee';

export type CurrentPoolInfo = [CkbAssetWithBalance, CkbSudtAssetWithBalance] | [];

export const useSwapTable = ({
  form,
  assets,
  tokenA,
  tokenB,
}: {
  form: FormInstance;
  assets: RealtimeInfo<GliaswapAssetWithBalance[]>;
  tokenA: GliaswapAssetWithBalance;
  tokenB: GliaswapAssetWithBalance;
}) => {
  const { setTokenA, setTokenB, setPay, setReceive, togglePair, pay, receive, isBid, swapMode } = useSwapContainer();
  const { ckbNativeAsset, ethNativeAsset, shadowEthAssets } = useGliaswapAssets();
  const [isPayInvalid, setIsPayInvalid] = useState(true);
  const [isReceiveInvalid, setIsReceiveInvalid] = useState(true);
  const { currentUserLock } = useGliaswap();
  const { poolInfo } = useLiquidityPoolInfo({ refetchInterval: 5e3 });

  const disabled = useMemo(() => {
    if (currentUserLock == null) {
      return true;
    }
    return isPayInvalid || isReceiveInvalid;
  }, [isPayInvalid, isReceiveInvalid, currentUserLock]);

  const findPoolInfo = useCallback(
    (tokens: [CkbAssetWithBalance, CkbAssetWithBalance] | []) => {
      if (tokens.length === 0) {
        return [];
      }
      for (let i = 0; i < poolInfo.value.length; i++) {
        const pool = poolInfo.value[i].assets;
        if (differenceWith(tokens, pool, CkbModel.equals).length === 0) {
          if (CkbModel.equals(tokens[0], pool[0])) {
            return pool;
          }
          return [pool[1], pool[0]];
        }
      }
      return [];
    },
    [poolInfo],
  );

  const currentPoolInfo = useMemo(() => {
    switch (swapMode) {
      case SwapMode.CrossChainOrder: {
        if (EthModel.isCurrentChainAsset(tokenA)) {
          const baseToken = shadowEthAssets.find((s) => s.shadowFrom.address === tokenA.address);
          return findPoolInfo([baseToken, tokenB] as [CkbAssetWithBalance, CkbAssetWithBalance]);
        }
        return [];
      }
      case SwapMode.NormalOrder: {
        return findPoolInfo([tokenA, tokenB] as [CkbAssetWithBalance, CkbAssetWithBalance]);
      }
      case SwapMode.CrossIn:
      case SwapMode.CrossOut:
        return [];
      default:
        return [];
    }
  }, [tokenA, tokenB, shadowEthAssets, swapMode, findPoolInfo]);

  const payReserve = useMemo(() => {
    const [sudt] = currentPoolInfo;
    return toStringNumberOrZero(sudt?.balance);
  }, [currentPoolInfo]);

  const receiveReserve = useMemo(() => {
    const [, sudt] = currentPoolInfo;
    return toStringNumberOrZero(sudt?.balance);
  }, [currentPoolInfo]);

  useEffect(() => {
    setTokenA((t) => calcBalance(pay, t));
    setTokenB((t) => calcBalance(receive, t));
  }, [pay, receive, setTokenA, setTokenB]);

  // init pair
  useEffect(() => {
    setTokenA(ethNativeAsset!);
    setTokenB(ckbNativeAsset!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pay === '') {
      setIsPayInvalid(true);
    }
    if (receive === '') {
      setIsReceiveInvalid(true);
    }
  }, [pay, receive]);

  // reset when pair changes
  useEffect(() => {
    form.resetFields();
    setPay('');
    setReceive('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA.symbol, tokenB.symbol]);

  const price = useMemo(() => {
    return calcPrice(pay, receive, isBid);
  }, [pay, receive, isBid]);

  const priceImpact = useMemo(() => {
    return calcPriceImpact(payReserve, receiveReserve, price, tokenA.decimals, tokenB.decimals);
  }, [payReserve, receiveReserve, price, tokenA.decimals, tokenB.decimals]);

  const findShadowAsset = useCallback(
    (erc20: EthErc20AssetWithBalance) => {
      return assets.value.find((a) => isShadowEthAsset(a) && a.shadowFrom.address === erc20.address) as
        | ShadowFromEthWithBalance
        | undefined;
    },
    [assets.value],
  );

  const onPaySelectAsset = useCallback(
    (_: unknown, selectedAsset: GliaswapAssetWithBalance) => {
      if (selectedAsset.symbol === tokenB.symbol) {
        if (isCkbNativeAsset(selectedAsset) && isEthAsset(tokenA)) {
          setTokenA(ckbNativeAsset!); // ckb
          setTokenB(findShadowAsset(tokenA)!);
        } else {
          togglePair();
        }
      } else if (isCkbNativeAsset(selectedAsset)) {
        if (isEthAsset(tokenB)) {
          setTokenA(tokenB);
          setTokenB(ckbNativeAsset!);
        } else {
          setTokenA(selectedAsset);
        }
      } else if (isEthAsset(selectedAsset) || isCkbSudtAsset(selectedAsset)) {
        if (EthModel.isCurrentChainAsset(tokenB)) {
          const shadowAsset = findShadowAsset(tokenB);
          setTokenA(selectedAsset);
          setTokenB(shadowAsset!);
        } else {
          setTokenA(selectedAsset);
        }
      }
    },
    [setTokenA, tokenB, setTokenB, tokenA, findShadowAsset, togglePair, ckbNativeAsset],
  );

  const onReceiveSelect = useCallback(
    (_: unknown, selectedAsset: GliaswapAssetWithBalance) => {
      if (selectedAsset.symbol === tokenA.symbol) {
        togglePair();
      } else if (isCkbNativeAsset(selectedAsset) && isEthAsset(tokenA)) {
        setTokenB(ckbNativeAsset!);
      } else if (isEthAsset(selectedAsset) && isCkbNativeAsset(tokenA)) {
        setTokenA(selectedAsset);
        setTokenB(ckbNativeAsset!);
      } else {
        setTokenB(selectedAsset);
      }
    },
    [setTokenA, setTokenB, tokenA, togglePair, ckbNativeAsset],
  );

  const receiveAssetFilter = useCallback(
    (asset: GliaswapAssetWithBalance) => {
      const isCurrentCKB = isCkbAsset(asset);
      const isSwapable = tokenA.symbol === asset.symbol;
      if (isCkbNativeAsset(tokenA)) {
        return true;
      } else if (isEthAsset(tokenA)) {
        return (isShadowEthAsset(asset) && asset.shadowFrom.address === tokenA.address) || isCurrentCKB;
      } else if (isShadowEthAsset(tokenA)) {
        return (isEthAsset(asset) && asset.address === tokenA.shadowFrom.address) || isCurrentCKB;
      } else if (isCkbSudtAsset(tokenA)) {
        return isSwapable || isCurrentCKB;
      }
      return true;
    },
    [tokenA],
  );

  const receiveSelectorDisabledKeys = useMemo(() => {
    return assets.value.filter((e) => !receiveAssetFilter(e)).map((a) => (isCkbAsset(a) ? a.typeHash : a.address));
  }, [assets.value, receiveAssetFilter]);

  const isPairTogglable = useMemo(() => {
    if (swapMode === SwapMode.CrossIn || swapMode === SwapMode.CrossOut) {
      return true;
    }
    if (isEthAsset(tokenA) && isCkbAsset(tokenB)) {
      return false;
    }
    return true;
  }, [tokenA, tokenB, swapMode]);

  const changePair = useCallback(() => {
    if (isPairTogglable) {
      togglePair();
    }
  }, [isPairTogglable, togglePair]);

  const poolName = useMemo(() => {
    let symbolA = tokenA.symbol;
    let symbolB = tokenB.symbol;
    if (EthModel.isCurrentChainAsset(tokenA)) {
      const token = findShadowAsset(tokenA);
      if (token) {
        symbolA = token.symbol;
      }
    }
    if (EthModel.isCurrentChainAsset(tokenB)) {
      const token = findShadowAsset(tokenB);
      if (token) {
        symbolA = token.symbol;
      }
    }
    return `${symbolA}-${symbolB}`;
  }, [tokenA, tokenB, findShadowAsset]);

  return {
    onPaySelectAsset,
    onReceiveSelect,
    receiveSelectorDisabledKeys,
    isPairToggleable: isPairTogglable,
    changePair,
    setIsPayInvalid,
    setIsReceiveInvalid,
    disabled,
    isBid,
    price,
    priceImpact,
    payReserve,
    receiveReserve,
    poolName,
    currentPoolInfo,
  };
};
