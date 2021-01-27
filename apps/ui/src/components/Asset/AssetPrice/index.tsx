import { SwapOutlined } from '@ant-design/icons';
import { Asset, AssetWithBalance, utils } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';
import { HumanizeBalance } from 'components/Balance';
import React from 'react';
import styled from 'styled-components';

type AssetPriceProps = { assets: Asset[]; prices: string[] } | { assets: AssetWithBalance[] };

const SwapIcon = styled(SwapOutlined)`
  border-radius: 50%;
  background: #5c61da;
  padding: 2px;
  color: #fff;
  margin: 0 4px;
`;

export const AssetBaseQuotePrices: React.FC<AssetPriceProps> = (props) => {
  const { assets } = props;

  const prices = utils.has(props, 'prices')
    ? props.prices
    : (assets as AssetWithBalance[]).map((asset) => asset.balance);

  const [base] = prices;

  const quotedPrice = prices.map((price, i) => new BigNumber(price).div(base).times(10 ** assets[i].decimals));

  return (
    <>
      {(assets as AssetWithBalance[]).map((asset, i) => (
        <span key={i}>
          <HumanizeBalance showSuffix asset={asset} value={quotedPrice[i]} />
          {i < assets.length - 1 && <SwapIcon />}
        </span>
      ))}
    </>
  );
};
