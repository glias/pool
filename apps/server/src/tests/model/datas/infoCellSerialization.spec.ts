import * as ckbUtils from '@nervosnetwork/ckb-sdk-utils';
import { CellInfoSerializationHolderFactory } from '../../../model';

test('serialized encoding and decoding args', () => {
  const typeHash1: CKBComponents.Script = {
    args: '0x002610d6b2c1c8e95ea84616e94604232c274426',
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    hashType: 'type',
  };

  const typeHash2 = typeHash1;

  const argsHex = CellInfoSerializationHolderFactory.getInstance()
    .getInfoCellSerialization()
    .encodeArgs(ckbUtils.scriptToHash(typeHash1), ckbUtils.scriptToHash(typeHash2));

  expect(CellInfoSerializationHolderFactory.getInstance().getInfoCellSerialization().decodeArgs(argsHex)).toEqual({
    hash: `0x${ckbUtils.scriptToHash(typeHash2).slice(2, 66)}`,
    infoTypeHash: `0x${ckbUtils.scriptToHash(typeHash2).slice(2, 66)}`,
  });
});

test('serialized encoding and decoding data', () => {
  const typeHash: CKBComponents.Script = {
    args: '0x002610d6b2c1c8e95ea84616e94604232c274426',
    codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
    hashType: 'type',
  };

  const data = {
    ckbReserve: 1000n,
    sudtReserve: 1000n,
    totalLiquidity: 2000n,
  };

  const dataHex = CellInfoSerializationHolderFactory.getInstance()
    .getInfoCellSerialization()
    .encodeData(data.ckbReserve, data.sudtReserve, data.totalLiquidity, ckbUtils.scriptToHash(typeHash));

  expect(CellInfoSerializationHolderFactory.getInstance().getInfoCellSerialization().decodeData(dataHex)).toEqual({
    ...data,
    liquiditySudtTypeHash: ckbUtils.scriptToHash(typeHash).slice(0, 66),
  });
});
