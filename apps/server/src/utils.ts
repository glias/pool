import blake2bUtil from 'blake2b';

export function blake2b(data: string[]): string {
  const hasher = blake2bUtil(32, null, null, Buffer.from('ckb-default-hash'));
  for (const bytes of data) {
    hasher.update(Buffer.from(bytes));
  }
  return `0x${hasher.digest('hex')}`;
}
