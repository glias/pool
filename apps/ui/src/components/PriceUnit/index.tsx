import React from 'react';
import { CkbAssetWithBalance, CkbModel, GliaswapAssetWithBalance } from '@gliaswap/commons';
import { useState } from 'react';
import { useCallback } from 'react';
import { useMemo } from 'react';
import { TableRow } from 'components/TableRow';
import { Balanced } from 'views/Swap/SwapItem';
import i18n from 'i18n';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { RetweetOutlined } from '@ant-design/icons';

export interface PriceUnitProps {
  tokenA: GliaswapAssetWithBalance | CkbAssetWithBalance;
  tokenB: GliaswapAssetWithBalance | CkbAssetWithBalance;
  price: string;
}

const Row = styled(TableRow)`
  .pointer {
    cursor: pointer;
    margin-left: 4px;
    margin-right: 4px;
  }
`;

const SwapIcon = styled(RetweetOutlined)`
  border-radius: 50%;
  background: #5c61da;
  padding: 2px;
  color: #fff;
  margin-left: 4px;
  svg {
    width: 10px;
    height: 10px;
  }
`;

export const PriceUnit = ({ tokenA, tokenB, price }: PriceUnitProps) => {
  const [isRevert, setIsRevert] = useState(false);

  const toggle = useCallback(() => {
    setIsRevert((revert) => !revert);
  }, []);

  const assets = useMemo(() => {
    if (!CkbModel.isNativeAsset(tokenA) && !CkbModel.isNativeAsset(tokenB)) {
      return [tokenA, tokenB];
    }
    const ckb = CkbModel.isNativeAsset(tokenA) ? tokenA : tokenB;
    const sudt = CkbModel.isNativeAsset(tokenA) ? tokenB : tokenA;
    return [sudt, ckb];
  }, [tokenA, tokenB]);

  const [baseToken, sellToken] = useMemo(() => {
    return isRevert ? [assets[1], assets[0]] : assets;
  }, [isRevert, assets]);

  const revertPrice = useMemo(() => {
    return isRevert ? new BigNumber(1).div(price) : price;
  }, [price, isRevert]);

  return (
    <Row label={i18n.t('common.price')}>
      <Balanced asset={{ ...baseToken, balance: new BigNumber(10).pow(baseToken.decimals).toString() }} />
      &nbsp;=&nbsp;
      <Balanced
        asset={{
          ...sellToken,
          balance: new BigNumber(10).pow(sellToken.decimals).times(revertPrice).toString(),
        }}
      />
      <SwapIcon onClick={toggle} />
    </Row>
  );
};
