import PWCore, { PwCollector, Transaction } from '@lay2/pw-core';
import Web3 from 'web3';
import Web3Modal, { ICoreOptions } from 'web3modal';
import { PWWeb3ModalProvider } from '../patch/PWWeb3ModalProvider';
import { Signer } from '../types';
import { AbstractWalletAdapter } from './AbstractWalletAdapter';

class PWSigner implements Signer<Transaction, Transaction> {
  address: string;

  constructor(private pw: PWCore, address?: string) {
    this.address = address ?? PWCore.provider.address.toCKBAddress(); // address ?? PWCore.provider.address;
  }

  sendTransaction(tx: Transaction): Promise<CKBComponents.Hash> {
    return this.pw.sendTransaction(tx);
  }
}

export class Web3ModalAdapter extends AbstractWalletAdapter<Transaction, Transaction> {
  readonly web3Modal: Web3Modal;
  provider: any;
  web3: Web3 | undefined;

  readonly pw: PWCore;

  readonly #ckbChainId: number;

  constructor(options: { web3ModalOptions?: Partial<ICoreOptions>; ckbNodeUrl?: string; ckbChainId?: number } = {}) {
    super();
    const { web3ModalOptions = {}, ckbNodeUrl = 'http://127.0.0.1:8114/rpc', ckbChainId = 1 } = options;
    this.#ckbChainId = ckbChainId;
    this.web3Modal = new Web3Modal({ cacheProvider: true, network: 'mainnet', ...web3ModalOptions });
    this.pw = new PWCore(ckbNodeUrl);
  }

  protected async getSigner(this: Web3ModalAdapter) {
    const provider = await this.web3Modal.connect();
    const web3 = new Web3(provider);
    const pwWeb3ModalProvider = new PWWeb3ModalProvider(web3);
    await this.pw.init(pwWeb3ModalProvider, new PwCollector(''), this.#ckbChainId);

    this.provider = provider;
    this.web3 = web3;
    this.signer = new PWSigner(this.pw);

    provider.on('accountsChanged', (accounts: string[] | undefined) => {
      if (!accounts?.length) {
        this.web3Modal.clearCachedProvider();
        this.afterDisconnected();
        return;
      }
      this.changeSigner(new PWSigner(this.pw));
    });
    return this.signer;
  }
}
