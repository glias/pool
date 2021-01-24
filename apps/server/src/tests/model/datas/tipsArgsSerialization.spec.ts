import { CellInfoSerializationHolderFactory } from '../../../model';

test('serialized encoding and decoding args', () => {
  const test = {
    tips: 0n,
    tipsSudt: 0n,
  };

  const argsHex = CellInfoSerializationHolderFactory.getInstance()
    .getTipsArgsSerialization()
    .encodeArgs(test.tips, test.tipsSudt);

  expect(CellInfoSerializationHolderFactory.getInstance().getTipsArgsSerialization().decodeArgs(argsHex)).toEqual(test);
});
