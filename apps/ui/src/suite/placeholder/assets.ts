import {
  CkbNativeAsset,
  CkbNativeAssetWithBalance,
  CkbSudtAsset,
  CkbSudtAssetWithBalance,
  EthErc20Asset,
  EthErc20AssetWithBalance,
  EthNativeAsset,
  EthNativeAssetWithBalance,
} from '@gliaswap/commons';

export const ckbNativeAsset: CkbNativeAsset = {
  chainType: 'Nervos',
  typeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  symbol: 'CKB',
  logoURI: 'http://121.196.29.165:3040/token/ckb.svg',
  name: 'CKB',
  decimals: 8,
};

export const ethNativeAsset: EthNativeAsset = {
  chainType: 'Ethereum',
  address: '0x0000000000000000000000000000000000000000',
  name: 'ETH',
  logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  symbol: 'ETH',
  decimals: 18,
};

export const ckbSudtGlia: CkbSudtAsset = {
  chainType: 'Nervos',
  decimals: 8,
  symbol: 'GLIA',
  name: 'Glia Test Token',
  logoURI: 'http://121.196.29.165:3040/token/glias.png',
  typeHash: '0x788c79191970e313693351531930b46a708b1ca58f6d414ddc8a8827afb554ff',
};

export const ethErc20Usdt: EthErc20Asset = {
  chainType: 'Ethereum',
  logoURI: 'https://etherscan.io/token/images/tether_32.png',
  symbol: 'USDT',
  decimals: 6,
  address: '0x1234567890123456789012345678901234567890',
  name: 'Tether USD',
};

// prettier-ignore
export const ckbNativeWithBalance: CkbNativeAssetWithBalance = { ...ckbNativeAsset, balance: '0', locked: '0', occupied: '0' };
export const ethNativeWithBalance: EthNativeAssetWithBalance = { ...ethNativeAsset, balance: '0' };
export const ckbSudtGliaWithBalance: CkbSudtAssetWithBalance = { ...ckbSudtGlia, balance: '0', locked: '0' };
export const ethErc20UsdtWithBalance: EthErc20AssetWithBalance = { ...ethErc20Usdt, balance: '0' };
