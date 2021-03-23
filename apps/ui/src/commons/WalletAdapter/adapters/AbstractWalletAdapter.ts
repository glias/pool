import EventEmitter from 'eventemitter3';
import { ConnectStatus, Signer, WalletAdapter } from '../types';

export abstract class AbstractWalletAdapter<Unsigned, Signed> implements WalletAdapter<Unsigned, Signed> {
  protected abstract getSigner(): Promise<Signer<Unsigned, Signed>>;

  async closeConnection(): Promise<void> {}

  protected emitter = new EventEmitter();

  signer: Signer<Unsigned, Signed> | null = null;

  status: ConnectStatus = 'disconnected';

  on = function (this: AbstractWalletAdapter<Unsigned, Signed>, event: string, listener: (x: unknown) => void): void {
    this.emitter.addListener(event, listener);
  } as WalletAdapter<Unsigned, Signed>['on'];

  protected changeSigner(signer: Signer<Unsigned, Signed>) {
    this.signer = signer;
    this.emitter.emit('signerChanged', signer);
  }

  protected afterConnected(signer: Signer<Unsigned, Signed>) {
    this.status = 'connected';
    this.signer = signer;
    this.emitter.emit('connectStatusChanged', 'connected', signer);
  }

  protected afterDisconnected() {
    this.status = 'disconnected';
    this.signer = null;
    this.emitter.emit('connectStatusChanged', 'disconnected');
  }

  connect() {
    this.status = 'connecting';
    this.emitter.emit('connectStatusChanged', 'connecting');
    return this.getSigner().then(
      (signer) => this.afterConnected(signer),
      (e) => {
        this.afterDisconnected();
        throw e;
      },
    );
  }

  async disconnect() {
    return this.closeConnection().finally(() => this.afterDisconnected());
  }

  async sendTransaction(tx: Unsigned | Signed): Promise<string> {
    if (!this.signer) throw new Error('Unable to send the transaction since the wallet is not connected,');
    // TODO replace with signTransaction when the Signer implemented it
    const txHash = this.signer?.sendTransaction(tx);
    this.emitter.emit('sendTransactionSuccessful', txHash);
    return txHash;
  }
}
