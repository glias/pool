/* eslint-disable @typescript-eslint/no-unused-vars */
import { QueryOptions } from '@ckb-lumos/base';
import sinon from 'sinon';
import { BizException } from '../bizException';
import { BridgeInfo, Cell, Script, TransactionWithStatus } from '../model';
import { DexRepository } from '../repository';
import { ckbMethods } from '../repository/dexRepository';

export class MockRepositoryFactory {
  static getDexRepositoryInstance(): MockRepository {
    return new MockRepository();
  }
}

export class MockRepository implements DexRepository {
  getPoolTxs: () => Promise<TransactionWithStatus[]>;
  getBlockTimestampByHash(blockHash: string): Promise<string> {
    throw new BizException('Method not implemented.');
  }
  async getForceBridgeHistory(
    lock: Script,
    ethAddress: string,
  ): Promise<{
    eth_to_ckb: BridgeInfo[];
    ckb_to_eth: BridgeInfo[];
  }> {
    return {
      eth_to_ckb: [],
      ckb_to_eth: [],
    };
  }

  async collectCells(queryOptions: QueryOptions, filterPool?: boolean, includePoolOutput?: boolean): Promise<Cell[]> {
    return [];
  }

  async collectTransactions(queryOptions: QueryOptions, includePool?: boolean): Promise<TransactionWithStatus[]> {
    return [];
  }

  async getTransactions(hashes: string[]): Promise<TransactionWithStatus[]> {
    return [];
  }

  getTransaction(hash: string): Promise<TransactionWithStatus> {
    return null;
  }

  async sendTransaction(tx: CKBComponents.RawTransaction): Promise<string> {
    return '';
  }

  mockCollectCells(): sinon.SinonStub<unknown[], unknown> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'collectCells');
  }

  mockCollectTransactions(): sinon.SinonStub<unknown[], unknown> | sinon.SinonStub<unknown[], unknown> {
    return sinon.stub(this, 'collectTransactions');
  }
}
