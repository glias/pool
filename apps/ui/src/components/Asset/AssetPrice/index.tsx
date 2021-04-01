import { RetweetOutlined } from '@ant-design/icons';
import { AssetWithBalance } from '@gliaswap/commons';
import { HumanizeBalance } from 'components/Balance';
import React, { useState } from 'react';
import styled from 'styled-components';
import { BN } from 'suite';

interface AssetPriceProps {
  /**
   * the pool assets
   */
  assets: AssetWithBalance[];
}

const SwapIcon = styled(RetweetOutlined)`
  border-radius: 50%;
  background: #5c61da;
  padding: 2px;
  color: #fff;
  margin-left: 4px;
  font-size: 0.8em;
  vertical-align: revert;
  cursor: pointer;
`;

interface AssetPriceItemProps {
  onBaseAssetChanged: () => void;
  baseAsset: AssetWithBalance;
  quoteAsset: AssetWithBalance;
}

const AssetPriceItem = ({ baseAsset, quoteAsset, onBaseAssetChanged }: AssetPriceItemProps) => {
  if (!Number(baseAsset.balance) || !Number(quoteAsset.balance)) return null;

  return (
    <span>
      <HumanizeBalance showSuffix asset={quoteAsset} value={10 ** quoteAsset.decimals} />
      &nbsp;=&nbsp;
      <HumanizeBalance
        showSuffix
        asset={baseAsset}
        value={BN(baseAsset.balance)
          .times(10 ** quoteAsset.decimals)
          .div(quoteAsset.balance)}
      />
      <SwapIcon onClick={() => onBaseAssetChanged()} />
    </span>
  );
};

export const AssetPrice: React.FC<AssetPriceProps> = (props) => {
  const [baseAssetIndex, setBaseAssetIndex] = useState(0);

  const baseAsset = props.assets[baseAssetIndex];
  const otherAssets = props.assets.slice(0, baseAssetIndex).concat(props.assets.slice(baseAssetIndex + 1));

  return (
    <>
      {otherAssets.map((anotherAsset, i) => (
        <AssetPriceItem
          key={i}
          baseAsset={baseAsset}
          quoteAsset={anotherAsset}
          onBaseAssetChanged={() => setBaseAssetIndex((index) => (index + 1) % props.assets.length)}
        />
      ))}
    </>
  );
};
