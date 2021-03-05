import * as constants from '@gliaswap/constants';

import { Script, Token } from '../../model';

export function hexBigint(n: bigint): string {
  return `0x${n.toString(16)}`;
}

export function minCKBChangeCapacity(userLock: Script): bigint {
  return (BigInt(userLock.size()) + 8n) * constants.CKB_DECIMAL; // +8 for capacity bytes
}

export function minTokenChangeCapacity(userLock: Script, tokenType: Script): bigint {
  const scriptSize = BigInt(userLock.size() + tokenType.size());
  return (scriptSize + 8n + constants.MIN_SUDT_DATA_SIZE) * constants.CKB_DECIMAL;
}

export function tips(token: Token): { tips: bigint; tipsSudt: bigint } {
  if (token.typeHash == constants.CKB_TYPE_HASH) {
    return {
      tips: BigInt(token.balance),
      tipsSudt: 0n,
    };
  } else {
    return {
      tips: 0n,
      tipsSudt: BigInt(token.balance),
    };
  }
}
