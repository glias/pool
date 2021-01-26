import blake2bUtil from 'blake2b';

export function blake2b(tokenTypeHash: string): string {
  const hasher = blake2bUtil(32, null, null, Buffer.from('ckb-default-hash'));
  hasher.update(Buffer.from('ckb'));
  hasher.update(Buffer.from(tokenTypeHash, 'hex'));
  return `0x${hasher.digest('hex')}`;
}

// [2] token 0x788c79191970e313693351531930b46a708b1ca58f6d414ddc8a8827afb554ff
// [2] pairha 0x0b5671d75017f5decee7c526d64512ffb8297f48b03720624bb01a9913545263

const tokenHash = '788c79191970e313693351531930b46a708b1ca58f6d414ddc8a8827afb554ff';
console.log(JSON.stringify(Buffer.from(tokenHash, 'hex')));
console.log(blake2b(tokenHash));
