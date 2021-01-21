import axios from 'axios';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import * as commons from '@gliaswap/commons';
import { Script, HashType } from '@lay2/pw-core';

const TEST_USER_LOCK = new Script(
  '0x0000000000000000000000000000000000000000000000000000000000000001',
  '0x',
  HashType.type,
);
const TEST_TOKEN_TYPE_SCRIPT = new Script(
  '0x0000000000000000000000000000000000000000000000000000000000000002',
  '0x',
  HashType.type,
);
const TEST_TOKEN_TYPE_HASH = TEST_TOKEN_TYPE_SCRIPT.toHash();
const TEST_POOL_ID = '0x0000000000000000000000000000000000000000000000000000000000000003';

const generateToken = (amount: number, typeHash: string, typeScript: Script) => {
  return {
    balance: amount.toString(),
    typeHash,
    typeScript,
    info: undefined,
  };
};

async function test() {
  const req = {
    tokenAAmount: generateToken(1000, CKB_TYPE_HASH, undefined),
    tokenBAmount: generateToken(200, TEST_TOKEN_TYPE_HASH, TEST_TOKEN_TYPE_SCRIPT),
    poolId: TEST_POOL_ID,
    userLock: TEST_USER_LOCK,
  };
  console.log(req);

  const resp = await axios.post('http://127.0.0.1:3000/v1/liquidity-pool/orders/genesis-liquidity', req);
  const tx = commons.TransactionHelper.deserializeTransaction(resp.data.tx);
  console.log(tx);
  console.log(resp.data.fee);
}

test();
