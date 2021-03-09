import { GliaswapAssetWithBalance } from '@gliaswap/commons';
import { Form } from 'antd';
import { TableRow } from 'components/TableRow';
import i18n from 'i18n';
import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { CROSS_CHAIN_FEE, SWAP_FEE } from 'suite/constants';
import { useMemo } from 'react';
import { Balanced } from '../SwapItem';
import { SwapMode } from '../context';
import { displayPercent } from './fee';
import { useGlobalSetting } from 'hooks/useGlobalSetting';
import { PriceUnit } from 'components/PriceUnit';

const Container = styled(Form.Item)``;

export interface InfoTableProps {
  tokenA: GliaswapAssetWithBalance;
  tokenB: GliaswapAssetWithBalance;
  price: string;
  priceImpact: string;
  swapMode: SwapMode;
}

export const InfoTable = ({ tokenA, tokenB, price, priceImpact, swapMode }: InfoTableProps) => {
  const [{ slippage }] = useGlobalSetting();

  const isCrossOut = useMemo(() => {
    return swapMode === SwapMode.CrossOut;
  }, [swapMode]);

  const swapFee = useMemo(() => {
    return new BigNumber(tokenA.balance)
      .times(isCrossOut ? CROSS_CHAIN_FEE : SWAP_FEE)
      .toFixed(tokenA.decimals, BigNumber.ROUND_DOWN);
  }, [tokenA.balance, tokenA.decimals, isCrossOut]);

  if (swapMode === SwapMode.CrossIn) {
    return null;
  }

  return (
    <Container>
      {isCrossOut ? null : (
        <>
          <PriceUnit tokenA={tokenA} tokenB={tokenB} price={price} />
          <TableRow
            label={i18n.t('swap.order-table.min-receive')}
            labelTooltip={i18n.t('swap.order-table.min-receive-desc')}
          >
            <Balanced asset={{ ...tokenB, balance: new BigNumber(tokenB.balance).times(1 - slippage).toString() }} />
          </TableRow>
          <TableRow
            label={i18n.t('swap.order-table.price-impact')}
            labelTooltip={i18n.t('swap.order-table.price-impact-desc')}
          >
            {displayPercent(priceImpact)}
          </TableRow>
        </>
      )}
      <TableRow
        label={i18n.t('swap.order-table.swap-fee')}
        labelTooltip={i18n.t(
          `swap.order-table.${swapMode === SwapMode.CrossOut ? 'cross-chain-fee' : 'swap-fee-desc'}`,
        )}
      >
        <Balanced asset={{ ...tokenA, balance: swapFee }} />
      </TableRow>
    </Container>
  );
};
