import { AssetManagerAPI, SerializedTransactionWithFee, TransferDetail } from '@gliaswap/commons';

export class DummyAssetManagerAPI implements AssetManagerAPI {
  async getTransactionSummaries() {
    return [];
  }

  getTransactionDetail(): Promise<TransferDetail> {
    return Promise.resolve({
      amount: '0',
      blockNumber: 0,
      fee: '',
      fromLock: { hashType: 'data', args: '0x', codeHash: '0x123456789' },
      status: 'pending',
      toLock: { hashType: 'data', args: '0x', codeHash: '0x123456789' },
      txHash: '',
      date: '',
    });
  }

  async generateTransferTransaction(): Promise<SerializedTransactionWithFee> {
    return Promise.resolve({ fee: '0' } as SerializedTransactionWithFee);
  }
}
