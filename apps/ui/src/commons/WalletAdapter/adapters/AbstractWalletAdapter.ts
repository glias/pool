import EventEmitter from 'eventemitter3';
import { ConnectStatus, Signer, WalletAdapter } from '../types';

export abstract class AbstractWalletAdapter<Unsigned, Signed> implements WalletAdapter<Unsigned, Signed> {
  protected abstract getSigner(): Promise<Signer<Unsigned, Signed>>;

  async closeConnection(): Promise<void> {}

  protected emitter: EventEmitter = new EventEmitter();

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
      () => this.afterDisconnected(),
    );
  }

  async disconnect() {
    return this.closeConnection().finally(() => this.afterDisconnected());
  }
}
