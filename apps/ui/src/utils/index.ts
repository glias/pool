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
