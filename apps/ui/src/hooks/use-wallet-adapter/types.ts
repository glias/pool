import { Address, Transaction } from '@lay2/pw-core';

export type Maybe<T> = T | null | undefined;

export type ConnectStatus = 'disconnected' | 'connecting' | 'connected';

export interface WalletAdapter<Config = unknown> {
  // TODO perhaps it would be more appropriate to use an Observable,
  //  since using Promise has limited ability to handle side effects,
  //  such as not being easily cancelled, etc.
  connect: (config?: Config) => Promise<Signer>;

  on: (eventName: 'signerChanged', cb: (signer: Signer | Promise<Signer>) => void) => void;
}

// TODO replace with a low level RawTransaction to decouple from PWCore Transaction
export interface Signer {
  sendTransaction: (tx: Transaction) => Promise<CKBComponents.Hash>;
  address: Address;
}
