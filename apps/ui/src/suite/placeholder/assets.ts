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
  logoURI: 'https://www.nervos.org/wp-content/uploads/2020/12/nervos-logo-white-700px.png',
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
  logoURI:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAQbSURBVHgB1ZnLbhNJFIb/qradNhkntkkC4ZZxZobRTMRoZkCjWYCEskZiwQ4WSPAAvALwJNnwBiyRCBILEKAIgYUSASaxiMFBmMQkvnYVp9rt0Cbd5W7HCOeXyl0uV7m+PufUqb4wOFrI5ZLDw5HLliVS+OES839MZubb35j6WCrmr0kpr0MiiUGRlAtbVTH7Tybzib0o5H7mzMhhAMUg7x4/ODXLFgvLc2DsMgZTcqtipTljbAoDLNPE3xx7QHsCMoI+SGxsAmUq1RolCAr4aATsp31AYtiud1WjCWj69QwpKzWI5VXIwhqkmsRHLDUKfngc/NCE5+/W85dg6nfq1zdIBSRe5wmw4NtHJV/Z7l9ah0VFvMqDz/wKnh7tABSrRRgEqVOomFTWsx481QLa/XzGisdZWATrBgyiwJZsA+pcq+S2IlPp2IWsapIgZfEjpIrhgApkSRvw8XNfQMq1HSBf69L7/0IAKgWCVDGoQP1E+z6+p7q6W6yuQbzVx45aDGw8DZYege3wSgWiWAocc7uH7AJo/J4Bn5rsbEzsgzGxH/yXoxQmWfJCFbuR1t12LH4skzu5qzD7KOjIvQBdYvEhypMj2K20lmx+2EStPoTWcmBgrt+iR9MwNIBKYdJMz5D1Ut2B3CnzyJhuaN8AlbSQWx+ENySlnOjYsOcYe0fKEiDlwn5Jb8lGDNV6K724XR1JGL5jig/L2Hip4jDhtLjTOzrbnPx6pGYijh4hBY+RJXfOY5SZ75j9p1LILY6j/J7p/hqu/I+xepMg/XOtdnULI4paw7Rdbh+d+ubnGMpvLc8xERM4damJkQPSE6q9O4XJ/1rIWEq5e4iK2TrWYtuw77P+4xToSQJNuEDbUL3sTlrI1LTRsmLNKQRXVUdqyy9EUXjGtKDKohPHRUd725JMHw3BIU269Bs5zGAJo1WszmP2dgQrj/wXUYM2muoG67wAcSwZxqBdt8XpMwJPbvmfy9IdjrUlhskTAvGkRJxObOMdUMpz29LNqtfqDqeukKljkopAacUf9BMBlVa6r+ZeL5YCXarNnBO2hfwUdDG445CFCMpAkOaoxF8Xmoia3hOGkRqXOKBqwc0a+B5HpZP/rjS3LdqT61grxv+/2rBjOKhC3YjFyaL/Ulo55DeBh3Xbbo3T87qTF5uYPt3aBGbOWS3QAB4JfUurQP+kCTJkkdx9A8VFuqSrOTN5bNFJWnQTvwkcPCEpXDo7KNAgYkvvVu7S0LPYhdTKrqxTTlzndhyo2FVxnDyGHWBealCa8uknhbRm+/KYxU5Tdi2YZb5VtxPZK0/Vvu/taD/ELYllDLbekCXFHAZTKhXP0VuIN1y9ihBS3oDzqAY/XjYHfcxLad1UDdupVL2FMIzI+QF4jyOd9zj32g1fADoH1qfZ8ZhHAAAAAElFTkSuQmCC',
  typeHash: '0x1234567812345678123456781234567812345678123456781234567812345678',
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
