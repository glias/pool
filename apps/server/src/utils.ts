import * as blake2bWasm from 'blake2b-wasm';

export function blake2b(data: string[]): string {
  const hasher = blake2bWasm(32, null, null, Buffer.from('ckb-default-hash'));
  data.map(Buffer.from).forEach(hasher.update);
  return `0x${hasher.digest('hex')}`;
}
