/* eslint-disable @typescript-eslint/no-unused-vars */
import sinon from 'sinon';
import { QueryOptions } from '@ckb-lumos/base';
import { BridgeInfo, Cell, Script, TransactionWithStatus } from '../model';
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
  async getForceBridgeHistory(
    lock: Script,
    pureCross: boolean,
  ): Promise<{
    eth_to_ckb: BridgeInfo[];
    ckb_to_eth: BridgeInfo[];
  }> {
    return {
      eth_to_ckb: [],
      ckb_to_eth: [],
    };
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
