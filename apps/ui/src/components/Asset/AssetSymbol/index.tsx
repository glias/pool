import { Asset } from '@gliaswap/commons';
import React from 'react';
import styled from 'styled-components';
import { getIconBackgroundColor } from 'suite';

interface WrapperProps {
  iconBackground?: string;
}

export interface TokenProps {
  asset: Asset;
  hideSymbolText?: boolean;
  hideSymbolIcon?: boolean;
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
    margin-right: 4px;
    padding: 4px;

    img {
      width: 1em;
      height: 1em;
    }
  }

  .symbol-text {
  }
`;

export const AssetSymbol = (props: TokenProps & WrapperProps & React.HTMLAttributes<HTMLSpanElement>) => {
  const { asset, hideSymbolText, hideSymbolIcon, ...others } = props;

  return (
    <AssetSymbolWrapper iconBackground={getIconBackgroundColor(asset)} {...others}>
      {!hideSymbolIcon && (
        <span className="icon">
          <img alt={asset.symbol} src={asset.logoURI} />
        </span>
      )}
      {!hideSymbolText && <span className="symbol-text">{asset.symbol}</span>}
    </AssetSymbolWrapper>
  );
};
