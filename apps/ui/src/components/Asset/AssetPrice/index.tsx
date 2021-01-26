import { SwapOutlined } from '@ant-design/icons';
import { Asset } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';
import { HumanizeBalance } from 'components/Balance';
import React from 'react';
import styled from 'styled-components';

interface AssetPriceProps {
  assets: Asset[];
  prices: string[];
}

const SwapIcon = styled(SwapOutlined)`
  border-radius: 50%;
  background: #5c61da;
  padding: 2px;
  color: #fff;
  margin: 0 4px;
`;

export const AssetBaseQuotePrices: React.FC<AssetPriceProps> = (props) => {
  const { assets, prices } = props;
  const [base] = prices;

  const quotedPrice = prices.map((price, i) => new BigNumber(price).div(base).times(10 ** assets[i].decimals));

  return (
    <>
      {assets.map((asset, i) => (
        <span key={i}>
          <HumanizeBalance asset={asset} value={quotedPrice[i]} showSuffix />
          {i < assets.length - 1 && <SwapIcon />}
        </span>
      ))}
    </>
  );
};
