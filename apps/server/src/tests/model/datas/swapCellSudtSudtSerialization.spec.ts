import { CellInfoSerializationHolderFactory } from '../../../model';

test('serialized encoding and decoding args', () => {
  const hex =
    '0x2e5a221c10510c7719de6fb0d11d851f8228f7c21644447814652343a1d1cbee9eb946551d1eed6aad1b186af975af8ddb2d5043a30d28b6228e6b66d4f3521a01e03fee05000000000000000000000000000000000000000000000000000000000000000000000000';

  const argsHex = CellInfoSerializationHolderFactory.getInstance().getSwapCellSudtSudtSerialization().decodeArgs(hex);

  const encode = CellInfoSerializationHolderFactory.getInstance()
    .getSwapCellSudtSudtSerialization()
    .encodeArgs(
      argsHex.sudtTypeHash,
      argsHex.userLockHash,
      argsHex.version,
      argsHex.amountOutMin,
      argsHex.tips,
      argsHex.tipsSudt,
    );

  expect(encode).toEqual(hex);
});

test('serialized encoding and decoding data', () => {
  const sudtAmount = 1000n;
  const dataHex = CellInfoSerializationHolderFactory.getInstance()
    .getSwapCellSudtSudtSerialization()
    .encodeData(sudtAmount);
  expect(
    CellInfoSerializationHolderFactory.getInstance().getSwapCellSudtSudtSerialization().decodeData(dataHex),
  ).toEqual(sudtAmount);
});
