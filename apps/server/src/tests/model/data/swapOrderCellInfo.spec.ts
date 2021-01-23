import { SwapOrderCellInfoSerialization } from '../../../model';
import * as ckbUtils from '@nervosnetwork/ckb-sdk-utils';

test('serialized encoding and decoding args', () => {
  const lockScript: CKBComponents.Script = {
    args: '0x002610d6b2c1c8e95ea84616e94604232c274426',
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    hashType: 'type',
  };

  const swap = {
    userLockHash: ckbUtils.scriptToHash(lockScript),
    version: 1,
    amountIn: 100n,
    minAmountOut: 100n,
    orderType: 1,
  };

  const argsHex = SwapOrderCellInfoSerialization.encodeArgs(
    swap.userLockHash,
    swap.version,
    swap.amountIn,
    swap.minAmountOut,
    swap.orderType,
  );

  expect(SwapOrderCellInfoSerialization.decodeArgs(argsHex)).toEqual(swap);
});

test('serialized encoding and decoding data', () => {
  const sudtAmount = 1000n;
  const dataHex = SwapOrderCellInfoSerialization.encodeData(sudtAmount);
  expect(SwapOrderCellInfoSerialization.decodeData(dataHex)).toEqual(sudtAmount);
});
