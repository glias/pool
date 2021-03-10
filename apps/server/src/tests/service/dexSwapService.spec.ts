// import 'reflect-metadata';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import sinonStubPromise from 'sinon-stub-promise';
import { Cell } from '../../model';
import { MockRepositoryFactory } from '../mockRepositoryFactory';

chai.use(sinonChai);
chai.should();
sinonStubPromise(sinon);

test('get orders', async () => {
  const cell: Cell = {
    cellOutput: undefined,
    outPoint: undefined,
    blockHash: '123123',
    blockNumber: '312321',
    data: '1asdadasdsadasdasd',
  };

  const r = MockRepositoryFactory.getDexRepositoryInstance();
  r.mockCollectCells().resolves([cell]);

  const result = await r.collectCells(null);
  expect(result).toEqual([cell]);
});
