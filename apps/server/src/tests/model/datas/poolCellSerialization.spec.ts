import { CellInfoSerializationHolderFactory } from '../../../model';

test('serialized encoding and decoding data', () => {
  const sudtAmount = 1000n;
  const dataHex = CellInfoSerializationHolderFactory.getInstance().getPoolCellSerialization().encodeData(sudtAmount);
  expect(CellInfoSerializationHolderFactory.getInstance().getPoolCellSerialization().decodeData(dataHex)).toEqual(
    sudtAmount,
  );
});
