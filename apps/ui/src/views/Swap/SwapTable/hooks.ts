import {
  EthErc20AssetWithBalance,
  GliaswapAssetWithBalance,
  isCkbNativeAsset,
  isCkbSudtAsset,
  isEthErc20Asset,
  isEthNativeAsset,
  isShadowEthAsset,
  ShadowOfEthWithBalance,
} from '@gliaswap/commons';
import { FormInstance } from 'antd/lib/form';
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
  const ethAsset = useMemo(() => {
    return assets.value.find((a) => isEthNativeAsset(a));
  }, [assets.value]);

  const ckbAsset = useMemo(() => {
    return assets.value.find((a) => isCkbNativeAsset(a));
  }, [assets.value]);

  // init pair
  useEffect(() => {
    setTokenA(ethAsset!);
    setTokenB(ckbAsset!);
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

  const onSelectPayAsset = useCallback(
    (_: unknown, selectedAsset: GliaswapAssetWithBalance) => {
      if (selectedAsset.symbol === tokenB.symbol) {
        if (isCkbNativeAsset(selectedAsset) && isEthErc20Asset(tokenA)) {
          // setTokenA() // ckb
          setTokenB(findShadowAsset(tokenA)!);
        } else {
          togglePair();
        }
      } else if (isCkbNativeAsset(selectedAsset)) {
        if (isEthErc20Asset(tokenB)) {
          setTokenA(tokenB);
          // setTokenB() // ckb
        } else {
          setTokenA(selectedAsset);
        }
      } else if (isEthErc20Asset(selectedAsset)) {
        const shadowAsset = findShadowAsset(selectedAsset);
        if (shadowAsset?.shadowFrom?.address === selectedAsset.address || isCkbNativeAsset(tokenB)) {
          setTokenA(selectedAsset);
        } else {
          setTokenA(selectedAsset);
        }
      } else if (isShadowEthAsset(selectedAsset)) {
        if (
          isCkbNativeAsset(tokenB) ||
          (isEthErc20Asset(tokenB) && tokenB.address === selectedAsset.shadowFrom.address)
        ) {
          setTokenA(selectedAsset);
        } else {
          setTokenA(selectedAsset);
          // setTokenB() // ckb
        }
      } else if (isCkbSudtAsset(selectedAsset)) {
        if (isCkbNativeAsset(tokenB)) {
          setTokenA(selectedAsset);
        } else {
          setTokenA(selectedAsset);
          // setTokenB() // ckb
        }
      }
    },
    [setTokenA, tokenB, setTokenB, tokenA, findShadowAsset, togglePair],
  );

  const onReceiveSelect = useCallback(
    (_: unknown, selectedAsset: GliaswapAssetWithBalance) => {
      if (selectedAsset.symbol === tokenA.symbol) {
        togglePair();
      } else if (isCkbNativeAsset(selectedAsset) && isEthErc20Asset(tokenA)) {
        setTokenA(tokenB);
        // setTokenB() // ckb
      } else if (isEthErc20Asset(selectedAsset) && isCkbNativeAsset(tokenA)) {
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
      } else if (isEthErc20Asset(tokenA)) {
        return (isShadowEthAsset(asset) && asset.shadowFrom.address === tokenA.address) || isCurrentCKB;
      } else if (isShadowEthAsset(tokenA)) {
        return (isEthErc20Asset(asset) && asset.address === tokenA.shadowFrom.address) || isCurrentCKB;
      } else if (isCkbSudtAsset(tokenA)) {
        return isSwapable || isCurrentCKB;
      }
      return true;
    },
    [tokenA],
  );

  return {
    onSelectPayAsset,
    onReceiveSelect,
    receiveAssetFilter,
  };
};
