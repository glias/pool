import dayjs from 'dayjs';
import { GliaswapAssetWithBalance } from '@gliaswap/commons';
import BigNumber from 'bignumber.js';

/**
 * @example
 * ```ts
 * truncateMiddle('0123456', 2) // 01...56
 * truncateMiddle('0123456', 4) // 0123456
 * ```
 */
export function truncateMiddle(str: string, takeLength = 6, tailLength = takeLength, pad = '...') {
  if (takeLength + tailLength >= str.length) return str;
  return `${str.slice(0, takeLength)}${pad}${str.slice(-tailLength)}`;
}

export function formatTimestamp(timestamp: string) {
  return dayjs(parseInt(timestamp, 10)).format('YYYY/MM/DD HH:mm:ss');
}

// export function getShadowAssetByERC20(erc20: ): Asset {

// }

export function removeTrailingZero(str: string) {
  return str.replace(/(\.[0-9]*[1-9])0+$|\.0*$/, '$1');
}

export function displayBalance(asset: GliaswapAssetWithBalance) {
  const balance = new BigNumber(asset.balance)
    .div(new BigNumber(10).pow(asset.decimals))
    .toFormat(8, BigNumber.ROUND_DOWN);

  return removeTrailingZero(balance.toString());
}
