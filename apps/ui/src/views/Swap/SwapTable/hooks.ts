import {
  CkbAssetWithBalance,
  CkbSudtAssetWithBalance,
  EthErc20AssetWithBalance,
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

  const currentSudt = useMemo(() => {
    switch (swapMode) {
      case SwapMode.CrossChainOrder: {
        if (isEthAsset(tokenA)) {
          const sudt = shadowEthAssets.find((s) => s.shadowFrom.address === tokenA.address);
          return sudt;
        }
        return undefined;
      }
      case SwapMode.NormalOrder: {
        if (isCkbNativeAsset(tokenA)) {
          return tokenB as CkbAssetWithBalance;
        }
        return tokenA as CkbAssetWithBalance;
      }
      case SwapMode.CrossIn:
      case SwapMode.CrossOut:
        return undefined;
      default:
        return undefined;
    }
  }, [tokenA, tokenB, swapMode, shadowEthAssets]);

  const currentPoolInfo = useMemo(() => {
    return (poolInfo.value.find((p) => p?.assets?.[1]?.typeHash === currentSudt?.typeHash)?.assets ??
      []) as CurrentPoolInfo;
  }, [currentSudt, poolInfo]);

  const payReserve = useMemo(() => {
    const [ckb, sudt] = currentPoolInfo;
    if (isBid) {
      return toStringNumberOrZero(ckb?.balance);
    }
    return toStringNumberOrZero(sudt?.balance);
  }, [isBid, currentPoolInfo]);

  const receiveReserve = useMemo(() => {
    const [ckb, sudt] = currentPoolInfo;
    if (isBid) {
      return toStringNumberOrZero(sudt?.balance);
    }
    return toStringNumberOrZero(ckb?.balance);
  }, [isBid, currentPoolInfo]);

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
    if (isBid) {
      return calcPriceImpact(payReserve, receiveReserve, price, tokenB.decimals);
    }
    return calcPriceImpact(receiveReserve, payReserve, price, tokenA.decimals);
  }, [payReserve, receiveReserve, price, isBid, tokenA.decimals, tokenB.decimals]);

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
      } else if (isEthAsset(selectedAsset)) {
        const shadowAsset = findShadowAsset(selectedAsset);
        if (shadowAsset?.shadowFrom?.address === selectedAsset.address || isCkbNativeAsset(tokenB)) {
          setTokenA(selectedAsset);
          setTokenB(ckbNativeAsset!);
        } else {
          setTokenA(selectedAsset);
        }
      } else if (isShadowEthAsset(selectedAsset)) {
        if (isCkbNativeAsset(tokenB) || (isEthAsset(tokenB) && tokenB.address === selectedAsset.shadowFrom.address)) {
          setTokenA(selectedAsset);
        } else {
          setTokenA(selectedAsset);
          setTokenB(ckbNativeAsset!);
        }
      } else if (isCkbSudtAsset(selectedAsset)) {
        if (isCkbNativeAsset(tokenB)) {
          setTokenA(selectedAsset);
        } else {
          setTokenA(selectedAsset);
          setTokenB(ckbNativeAsset!); // ckb
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
      const isCurrentCKB = isCkbNativeAsset(asset);
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
    if (isEthAsset(tokenA) && isCkbNativeAsset(tokenB)) {
      return false;
    }
    return true;
  }, [tokenA, tokenB]);

  const changePair = useCallback(() => {
    if (isPairTogglable) {
      togglePair();
    }
  }, [isPairTogglable, togglePair]);

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
  };
};
