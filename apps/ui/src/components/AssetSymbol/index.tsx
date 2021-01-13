import { Asset } from 'commons/MultiAsset/types';
import React from 'react';
import styled from 'styled-components';
import { getIconBackgroundColor } from '../../hooks/use-gliaswap';

interface WrapperProps {
  iconBackground?: string;
}

export interface TokenProps extends WrapperProps, React.HTMLAttributes<HTMLSpanElement> {
  asset: Asset;
}

const AssetSymbolWrapper = styled.span<WrapperProps>`
  display: inline-flex;
  justify-content: center;
  align-items: center;

  .icon {
    background-color: ${(props) => props.iconBackground};
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 8px;
    padding: 4px;

    img {
      width: 1em;
      height: 1em;
    }
  }

  .asset-name {
    font-weight: bold;
    color: #000000;
  }
`;

export const AssetSymbol = (props: TokenProps) => {
  const { asset, ...others } = props;

  return (
    <AssetSymbolWrapper iconBackground={getIconBackgroundColor(asset)} {...others}>
      <span className="icon">
        <img alt={asset.symbol} src={asset.logoURI} />
      </span>
      <span className="asset-name">{asset.symbol}</span>
    </AssetSymbolWrapper>
  );
};
