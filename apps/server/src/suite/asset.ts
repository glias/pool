import {
  Asset,
  CkbAsset,
  CkbAssetWithBalance,
  isShadowEthAsset,
  ShadowFromEthWithBalance,
  utils,
} from '@gliaswap/commons';
import { Token, TokenInfo } from '../model';

export function TokenFromAsset(asset: CkbAsset | CkbAssetWithBalance | ShadowFromEthWithBalance): Token {
  const balance = utils.has(asset, 'balance') ? asset.balance : undefined;
  const shadowFrom = isShadowEthAsset(asset) ? asset.shadowFrom : undefined;

  return new Token(asset.typeHash, null, TokenInfoFromAsset(asset), TokenInfoFromAsset(shadowFrom), balance);
}

export function TokenInfoFromAsset(asset: Asset): TokenInfo {
  const address = utils.has(asset, 'address') ? (asset.address as string) : '';
  return new TokenInfo(asset.name, asset.symbol, asset.decimals, asset.logoURI, address, asset.chainType);
}
