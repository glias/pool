import * as utils from '../../../../src/utils';
import { CellInfoSerializationHolderFactory, Script } from '../../../model';

const typeHash1: Script = new Script(
  '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  'type',
  '0x002610d6b2c1c8e95ea84616e94604232c274426',
);

const typeHash2 = typeHash1;

test('serialized encoding and decoding args', () => {
  const argsHex = CellInfoSerializationHolderFactory.getInstance()
    .getInfoCellSerialization()
    .encodeArgs(typeHash1.toHash(), typeHash2.toHash());

  expect(CellInfoSerializationHolderFactory.getInstance().getInfoCellSerialization().decodeArgs(argsHex)).toEqual({
    hash: `0x${utils.blake2b(['ckb', typeHash2.toHash()]).slice(2, 66)}`,
    infoTypeHash: `0x${typeHash2.toHash().slice(2, 66)}`,
  });
});

test('serialized encoding and decoding data', () => {
  // const typeHash: CKBComponents.Script = {
  //   args: '0x002610d6b2c1c8e95ea84616e94604232c274426',
  //   codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
  //   hashType: 'type',
  // };

  const data = {
    ckbReserve: 1000n,
    sudtReserve: 1000n,
    totalLiquidity: 2000n,
  };

  const dataHex = CellInfoSerializationHolderFactory.getInstance()
    .getInfoCellSerialization()
    .encodeData(data.ckbReserve, data.sudtReserve, data.totalLiquidity, typeHash1.toHash());

  expect(CellInfoSerializationHolderFactory.getInstance().getInfoCellSerialization().decodeData(dataHex)).toEqual({
    ...data,
    liquiditySudtTypeHash: typeHash1.toHash().slice(0, 66),
  });
});
