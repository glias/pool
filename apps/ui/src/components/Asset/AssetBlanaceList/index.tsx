import { Asset, AssetWithBalance } from '@gliaswap/commons';
import { AssetSymbol } from 'components/Asset/AssetSymbol';
import { HumanizeBalance } from 'components/Balance';
import React from 'react';
import styled from 'styled-components';

interface LiquidityAssetSymbolsProps {
  assets: Asset[];
}

export const PoolAssetSymbol: React.FC<LiquidityAssetSymbolsProps> = (props) => {
  const assets = props.assets;

  return (
    <>
      {assets.map((asset, i) => (
        <AssetSymbol key={i} hideSymbolText asset={asset} />
      ))}
      <span>{assets.map((x) => x.symbol).join('-')}</span>
    </>
  );
};

const LiquidityAssetAmountsWrapper = styled.div`
  table {
    width: 100%;
  }

  .column-numerical {
    padding-right: 4px;
    text-align: right;
  }

  .column-symbol {
    width: 1%;
  }
`;

interface LiquidityAssetAmountProps {
  assets: AssetWithBalance[];
  hideSymbolText?: boolean;
  hideSymbolIcon?: boolean;
}

export const AssetBalanceList: React.FC<LiquidityAssetAmountProps & React.HTMLAttributes<HTMLDivElement>> = ({
  assets,
  hideSymbolIcon,
  hideSymbolText,
  ...styledProps
}) => {
  return (
    <LiquidityAssetAmountsWrapper {...styledProps}>
      <table>
        <tbody>
          {assets.map((asset, i) => (
            <tr key={i}>
              <td className="column-numerical">
                <HumanizeBalance asset={asset} value={asset.balance} />
              </td>
              <td className="column-symbol">
                <AssetSymbol asset={asset} hideSymbolText={hideSymbolText} hideSymbolIcon={hideSymbolIcon} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </LiquidityAssetAmountsWrapper>
  );
};
