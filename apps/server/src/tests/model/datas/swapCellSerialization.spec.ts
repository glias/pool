import * as ckbUtils from '@nervosnetwork/ckb-sdk-utils';
import { CellInfoSerializationHolderFactory } from '../../../model';
import { CKB_TYPE_HASH } from '@gliaswap/constants';

test('serialized encoding and decoding args', () => {
  const lockScript: CKBComponents.Script = {
    args: '0x002610d6b2c1c8e95ea84616e94604232c274426',
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    hashType: 'type',
  };

  const swap = {
    userLockHash: ckbUtils.scriptToHash(lockScript),
    version: 1,
    minAmountOut: 100n,
    sudtTypeHash: CKB_TYPE_HASH,
    tips: 0n,
    tipsSudt: 0n,
  };

  const argsHex = CellInfoSerializationHolderFactory.getInstance()
    .getSwapCellSerialization()
    .encodeArgs(swap.userLockHash, swap.version, swap.minAmountOut, swap.sudtTypeHash, swap.tips, swap.tipsSudt);

  expect(CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().decodeArgs(argsHex)).toEqual(swap);
});

test('serialized encoding and decoding data', () => {
  const sudtAmount = 1000n;
  const dataHex = CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().encodeData(sudtAmount);
  expect(CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().decodeData(dataHex)).toEqual(
    sudtAmount,
  );
});
