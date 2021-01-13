import { Asset, AssetWithBalance, Balanced, isCkbNativeAsset, isSudt, Sudt } from 'commons/MultiAsset';

export interface NativeCkbAsset extends AssetWithBalance {
  chainType: 'CKB';
  isNativeCkbAsset: true;
  occupied: string;
  locked: string;
}

export interface SudtWithBalance extends Sudt, AssetWithBalance {
  chainType: 'CKB';
  balance: string;
}

export interface NativeEthAsset extends AssetWithBalance {
  chainType: 'ETH';
  isEthNativeAsset: true;
}

export interface Erc20 extends Asset {
  chainType: 'ETH';
  isErc20Asset: true;
}

export interface Erc20WithBalance extends Erc20, Balanced {
  address: string;
}

function hasOwnProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  if (!obj) return false;
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function propertyEq<K extends string, V>(obj: unknown, key: K, value: V): obj is Record<K, V> {
  return hasOwnProperty(obj, key) && obj[key] === value;
}

export function isNativeCkbAsset() {}

export function isNativeEthAsset(asset: Asset): asset is NativeEthAsset {
  return propertyEq(asset, 'isEthNativeAsset', true);
}

export function isErc20(asset: Asset): asset is Erc20 {
  return propertyEq(asset, 'isErc20Asset', true);
}

// TODO fill the address

export function isErc20Usdt(asset: Asset): asset is Erc20 {
  return isErc20(asset) && propertyEq(asset, 'address', '0x');
}

export function isErc20Usdc(asset: Asset): asset is Erc20 {
  return isErc20(asset) && propertyEq(asset, 'address', '0x');
}

export function isErc20Dai(asset: Asset): asset is Erc20 {
  return isErc20(asset) && propertyEq(asset, 'address', '0x');
}

export function getIconBackgroundColor(asset: Asset): string {
  if (isCkbNativeAsset(asset) || isSudt(asset)) return '#d9e8e2';
  if (isNativeEthAsset(asset)) return '#c1c8e2';
  if (isErc20Usdt(asset)) return '#b0e3d4';
  if (isErc20Usdc(asset)) return '#b3d0f0';
  if (isErc20Dai(asset)) return '#efddbf';
  return '#eee';
}
