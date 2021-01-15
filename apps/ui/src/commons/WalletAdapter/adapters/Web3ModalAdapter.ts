import PWCore, { Address, AddressType, PwCollector, Transaction } from '@lay2/pw-core';
import { EventEmitter } from 'events';
import Web3 from 'web3';
import Web3Modal, { ICoreOptions } from 'web3modal';
import { PWWeb3ModalProvider } from '../patch/PWWeb3ModalProvider';
import { Signer, WalletAdapter } from '../types';

class DummySigner implements Signer {
  address: Address = new Address('', AddressType.ckb);

  sendTransaction(): Promise<CKBComponents.Hash> {
    return Promise.reject('No wallet connected yet');
  }
}

class PWSigner implements Signer {
  readonly address: Address;

  constructor(private pw: PWCore) {
    this.address = PWCore.provider.address;
  }

  sendTransaction(tx: Transaction): Promise<CKBComponents.Hash> {
    return this.pw.sendTransaction(tx);
  }
}

export class Web3ModalAdapter extends EventEmitter implements WalletAdapter {
  readonly modal: Web3Modal;
  provider: any;

  readonly pw: PWCore;

  signer: Signer = new DummySigner();

  readonly #ckbChainId: number;

  constructor(options: { web3ModalOptions?: Partial<ICoreOptions>; ckbNodeUrl?: string; ckbChainId?: number } = {}) {
    super();
    const { web3ModalOptions = {}, ckbNodeUrl = 'http://127.0.0.1:8114', ckbChainId = 1 } = options;
    this.#ckbChainId = ckbChainId;
    this.modal = new Web3Modal({ cacheProvider: true, network: 'mainnet', ...web3ModalOptions });
    this.pw = new PWCore(ckbNodeUrl);
  }

  async connect(): Promise<Signer> {
    const provider = await this.modal.connect();
    this.provider = provider;
    const pwWeb3ModalProvider = new PWWeb3ModalProvider(new Web3(provider));

    provider.on('accountsChanged', (accounts: string[] | undefined) => {
      if (!accounts?.length) {
        this.modal.clearCachedProvider();
        this.emit('signerChanged', undefined);
        return;
      }
      this.signer = new PWSigner(this.pw);
      this.emit('signerChanged', this.signer);
    });

    await this.pw.init(pwWeb3ModalProvider, new PwCollector(''), this.#ckbChainId);

    this.signer = new PWSigner(this.pw);

    return this.signer;
  }
}

export const throwDisconnected = (msg = 'Disconnected') => () => Promise.reject(msg);

export const dummySigner: Signer = {
  sendTransaction: throwDisconnected(),
  address: new Address('', AddressType.eth),
};

export const dummyAdapter: WalletAdapter = {
  connect: throwDisconnected(),
  on: throwDisconnected(),
};
