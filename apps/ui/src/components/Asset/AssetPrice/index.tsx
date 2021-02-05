import { SwapOutlined } from '@ant-design/icons';
import { AssetWithBalance } from '@gliaswap/commons';
import { HumanizeBalance } from 'components/Balance';
import React from 'react';
import styled from 'styled-components';
import { BN } from 'suite';

interface AssetPriceProps {
  /**
   * the pool assets
   */
  assets: AssetWithBalance[];
}

const SwapIcon = styled(SwapOutlined)`
  border-radius: 50%;
  background: #5c61da;
  padding: 2px;
  color: #fff;
  margin: 0 4px;
`;

export const AssetBaseQuotePrices: React.FC<AssetPriceProps> = (props) => {
  const [baseAsset, ...otherAssets] = props.assets;

  return (
    <>
      {otherAssets.map((otherAsset, i) => (
        <span key={i}>
          <HumanizeBalance showSuffix asset={otherAsset} value={10 ** otherAsset.decimals} />
          <SwapIcon />
          <HumanizeBalance
            showSuffix
            asset={baseAsset}
            value={BN(baseAsset.balance)
              .div(otherAsset.balance)
              .times(10 ** otherAsset.decimals)}
          />
        </span>
      ))}
    </>
  );
};
