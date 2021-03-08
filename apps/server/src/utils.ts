import { blake2b as blake2bUtil } from '@nervosnetwork/ckb-sdk-utils';

export function blake2b(hexData: string[]): string {
  const hasher = blake2bUtil(32, null, null, Buffer.from('ckb-default-hash'));
  for (const str of hexData) {
    if (str.startsWith('0x')) {
      hasher.update(Buffer.from(str.slice(2), 'hex'));
    } else {
      hasher.update(Buffer.from(str));
    }
  }

  return `0x${hasher.digest('hex')}`;
}

export function trim0x(hexStr: string): string {
  if (hexStr.startsWith('0x') || hexStr.startsWith('0X')) {
    return hexStr.slice(2);
  }
  return hexStr;
}
