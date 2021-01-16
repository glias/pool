import { Meta } from '@storybook/react/types-6-0';
import 'antd/dist/antd.css';
import { AssetWithBalance } from '@gliaswap/commons';
import { AssetSelector } from 'components/AssetSelector';
import React, { useState } from 'react';
import TokenImage from './token.svg';

const meta: Meta = {
  title: 'Example/TokenSelector',
  component: AssetSelector,
};

export const Basic: React.VFC = () => {
  // prettier-ignore
  const assets: AssetWithBalance[] = [
    { chainType: 'Nervos', logoURI: TokenImage, name: 'Glia Test Token0', symbol: 'GLIA0', decimals: 8, balance: '0' },
    { chainType: 'Nervos', logoURI: TokenImage, name: 'Glia Test Token1', symbol: 'GLIA1', decimals: 8, balance: '0' },
    { chainType: 'Nervos', logoURI: TokenImage, name: 'Glia Test Token2', symbol: 'GLIA2', decimals: 8, balance: '1234567890' },
  ];

  const [selected, setSelected] = useState<number>(0);

  return (
    <AssetSelector
      selectedKey={selected}
      onSelected={(key) => setSelected(key as number)}
      assets={assets}
      renderKey={(_, i) => i}
    />
  );
};

export const Grouped: React.VFC = () => {
  // prettier-ignore
  const assets: AssetWithBalance[] = [
    { chainType: 'Nervos', logoURI: TokenImage, name: 'Glia Test Token0', symbol: 'GLIA0', decimals: 8, balance: '0' },
    { chainType: 'Nervos', logoURI: TokenImage, name: 'Glia Test Token1', symbol: 'GLIA1', decimals: 8, balance: '0' },
    { chainType: 'Nervos', logoURI: TokenImage, name: 'Glia Test Token2', symbol: 'GLIA2', decimals: 8, balance: '1234567890' },
    { chainType: 'Ethereum', logoURI: TokenImage, name: 'ETH Native Token', symbol: 'ETH', decimals: 18, balance: '12345678901234567890' },
  ];

  const [selected, setSelected] = useState<number>(0);

  return (
    <AssetSelector
      selectedKey={selected}
      onSelected={(key, asset) => {
        setSelected(key as number);
        console.log(asset);
      }}
      assets={assets}
      renderKey={(_, i) => i}
      group={(asset) => asset.chainType}
    />
  );
};

export default meta;
