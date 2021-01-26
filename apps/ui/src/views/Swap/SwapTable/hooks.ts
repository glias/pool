import {
  EthErc20AssetWithBalance,
  GliaswapAssetWithBalance,
  isCkbNativeAsset,
  isCkbSudtAsset,
  isEthAsset,
  isShadowEthAsset,
  ShadowOfEthWithBalance,
} from '@gliaswap/commons';
import { FormInstance } from 'antd/lib/form';
import { useGliaswapAssets } from 'contexts';
import { RealtimeInfo } from 'contexts/GliaswapAssetContext';
import { useMemo, useEffect, useCallback } from 'react';
import { useSwapContainer } from '../context';

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
  const { setTokenA, setTokenB, setPay, setReceive, togglePair } = useSwapContainer();
  const { ckbNativeAsset, ethNativeAsset } = useGliaswapAssets();

  // init pair
  useEffect(() => {
    setTokenA(ethNativeAsset!);
    setTokenB(ckbNativeAsset!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset when pair changes
  useEffect(() => {
    form.resetFields();
    setPay('');
    setReceive('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenA.symbol, tokenB.symbol]);

  const findShadowAsset = useCallback(
    (erc20: EthErc20AssetWithBalance) => {
      return assets.value.find((a) => isShadowEthAsset(a) && a.shadowFrom.address === erc20.address) as
        | ShadowOfEthWithBalance
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
        setTokenA(tokenB);
        // setTokenB() // ckb
      } else if (isEthAsset(selectedAsset) && isCkbNativeAsset(tokenA)) {
        setTokenA(selectedAsset);
        // setTokenB() // ckb
      } else {
        setTokenB(selectedAsset);
      }
    },
    [setTokenA, tokenB, setTokenB, tokenA, togglePair],
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
    return assets.value.filter((e) => !receiveAssetFilter(e)).map((a) => a.symbol);
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
  };
};
