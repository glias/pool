import sinon from 'sinon';
import { QueryOptions } from '@ckb-lumos/base';
import { Cell, Script, TransactionWithStatus } from '../model';
import { DexRepository } from '../repository';
import { ckbMethods } from '../repository/dexRepository';

export class MockRepositoryFactory {
  static getDexRepositoryInstance(): MockRepository {
    return new MockRepository();
  }
}

export class MockRepository implements DexRepository {
  getBlockTimestampByHash(blockHash: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  async getForceBridgeHistory(lock: Script, pureCross: boolean): Promise<[]> {
    return [];
  }

  async collectCells(queryOptions: QueryOptions): Promise<Cell[]> {
    return [];
  }

  async collectTransactions(queryOptions: QueryOptions): Promise<TransactionWithStatus[]> {
    return [];
  }

  getTransactions(ckbReqParams: [method: ckbMethods][]): Promise<TransactionWithStatus[]> {
    throw new Error('Method not implemented.');
  }

  getTransaction(hash: string): Promise<TransactionWithStatus> {
    throw new Error('Method not implemented.');
  }

  mockCollectCells(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'collectCells');
  }

  mockCollectTransactions(): sinon.SinonStub<any[], any> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'collectTransactions');
  }
}
