export type ConnectStatus = 'disconnected' | 'connecting' | 'connected';
type TransactionHash = string;

export type Maybe<T> = T | null | undefined;

export interface Signer<Unsigned, Signed> {
  // a ckb encoded address, is normally a lock script hash
  address: string;

  signTransaction?: (rawTransaction: Unsigned) => Promise<Signed>;
  // send the signed transaction or sign and send the signed transaction
  sendTransaction: (signed: Unsigned | Signed) => Promise<TransactionHash>;
}

export interface WalletAdapterListener<Unsigned, Signed> {
  on(event: 'signerChanged', listener: (signer: Signer<Unsigned, Signed> | null) => void): void;
  on(event: 'connectStatusChanged', listener: (status: ConnectStatus, signer?: Signer<Unsigned, Signed>) => void): void;
}

export interface Wallet<Unsigned, Signed> {
  status: ConnectStatus;
  // TODO perhaps it would be more appropriate to use an Observable,
  //  since using Promise has limited ability to handle side effects,
  //  such as not being easily cancelled, etc.
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signer: Signer<Unsigned, Signed> | null;
}

export interface WalletAdapter<Unsigned, Signed>
  extends WalletAdapterListener<Unsigned, Signed>,
    Wallet<Unsigned, Signed> {}
