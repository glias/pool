import { RawTransaction, Transaction } from '@lay2/pw-core';
import { TransactionHelper } from './transaction';

test('serialize and deserialize transaction', () => {
  const deserialized = TransactionHelper.deserializeTransaction({
    witnessArgs: [],
    cellDeps: [],
    headerDeps: [],
    inputCells: [],
    outputCells: [],
    version: '0x01',
  });

  expect(deserialized).toEqual(new Transaction(new RawTransaction([], [], [], [], '0x01'), []));
});
