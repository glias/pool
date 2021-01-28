import { BigNumber } from 'bignumber.js';
import React from 'react';
import styled from 'styled-components';

const BalanceWrapper = styled.span`
  .balance-integer {
  }

  .balance-decimal {
    font-size: 0.8em;
    color: #666;
  }

  .balance-suffix {
    color: #888;
    margin-left: 4px;
  }
`;

export interface BalanceProps extends React.HTMLAttributes<HTMLSpanElement> {
  asset: { decimals: number; symbol: string; balance?: BigNumber.Value };

  value?: BigNumber.Value;
  /**
   * display the symbol of the asset after the balance
   */
  showSuffix?: boolean;
  /**
   * the maximum number of decimal places left
   */
  maxToFormat?: number;
}

export const HumanizeBalance: React.FC<BalanceProps> = (props) => {
  const { asset, value = asset.balance || 0, showSuffix, maxToFormat, ...otherProps } = props;

  const balanceNum = new BigNumber(value).div(10 ** asset.decimals);

  if (balanceNum.isNaN()) {
    return (
      <BalanceWrapper {...otherProps}>
        <span className="balance-integer">0</span>
      </BalanceWrapper>
    );
  }

  const decimalPlaces = balanceNum.decimalPlaces();
  const balance: string = (() => {
    if (maxToFormat !== undefined) return balanceNum.toFormat(Math.min(maxToFormat, decimalPlaces));
    if (decimalPlaces >= 4) return balanceNum.toFormat(4);
    return balanceNum.toFormat();
  })();

  const [integers, decimals] = balance.split('.');
  const integerPart = decimals ? integers + '.' : integers;

  return (
    <BalanceWrapper {...otherProps}>
      <span className="balance-integer">{integerPart}</span>
      {decimals && <small className="balance-decimal">{decimals}</small>}
      {showSuffix && <span className="balance-suffix">{asset.symbol}</span>}
    </BalanceWrapper>
  );
};
