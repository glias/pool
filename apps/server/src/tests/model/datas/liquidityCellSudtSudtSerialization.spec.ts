import { CellInfoSerializationHolderFactory } from '../../../model';

test('serialized encoding and decoding args', () => {
  const hex =
    '0x738f0a66a6ff93b84eb3bd171b0807b8124a87e866be25dbdbbc6b106ae81a659eb946551d1eed6aad1b186af975af8ddb2d5043a30d28b6228e6b66d4f3521a010080836f3af3ce0d0000000000000000e03fee0500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

  const argsHex = CellInfoSerializationHolderFactory.getInstance()
    .getLiquidityCellSudtSudtSerialization()
    .decodeArgs(hex);
  const encode = CellInfoSerializationHolderFactory.getInstance()
    .getLiquidityCellSudtSudtSerialization()
    .encodeArgs(
      argsHex.infoTypeHash,
      argsHex.userLockHash,
      argsHex.version,
      argsHex.sudtXMin,
      argsHex.sudtYMin,
      argsHex.tipsCkb,
      argsHex.tipsSudtX,
      argsHex.tipsSudty,
    );

  expect(encode).toEqual(hex);
});

test('serialized encoding and decoding data', () => {
  const sudtAmount = 1000n;
  const dataHex = CellInfoSerializationHolderFactory.getInstance()
    .getLiquidityCellSudtSudtSerialization()
    .encodeData(sudtAmount);
  expect(CellInfoSerializationHolderFactory.getInstance().getLiquidityCellSerialization().decodeData(dataHex)).toEqual(
    sudtAmount,
  );
});
