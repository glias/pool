/**
 * perhaps a trusted cross-link list
 * could be maintained in future
 */
export type ChainType = 'Nervos' | 'Ethereum' | string;

export interface Asset {
  chainType: ChainType;

  name: string;
  decimals: number;
  symbol: string;
  logoURI?: string;
}

export interface Sudt extends Asset {
  type: {
    codeHash: string;
    args: string;
    hashType: string;
  };
}

export type RealtimeInfo<T> = {
  // unix timestamp milliseconds
  lastUpdated: number;
  // status: 'pending' | 'fulfilled' | 'rejected';
  value: T;
};

export interface Balanced {
  balance: string;
}

export interface AssetWithBalance extends Balanced, Asset {}

export function isCkbNativeAsset(asset: Asset): boolean {
  return !!(asset.chainType && asset.chainType === 'Nervos' && !isSudt(asset));
}

export function isSudt(asset: Asset): asset is Sudt {
  return 'type' in asset;
}

export function isBalanced(asset: Asset): asset is AssetWithBalance {
  return asset && 'balance' in asset;
}
