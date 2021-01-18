import { PoolCellInfoSerialization } from '../../../model';

test('serialized encoding and decoding data', () => {
  const sudtAmount = 1000n;
  const dataHex = PoolCellInfoSerialization.encodeData(sudtAmount);
  expect(PoolCellInfoSerialization.decodeData(dataHex)).toEqual(sudtAmount);
});
