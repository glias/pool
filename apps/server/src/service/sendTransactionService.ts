import { ckbRepository, DexRepository } from '../repository';

export class SendTransactionService {
  private readonly ckbRepository: DexRepository;

  constructor() {
    this.ckbRepository = ckbRepository;
  }

  async sendTransaction(tx: CKBComponents.RawTransaction): Promise<string> {
    return await this.ckbRepository.sendTransaction(tx);
  }
}

export const sendTransactionService = new SendTransactionService();
