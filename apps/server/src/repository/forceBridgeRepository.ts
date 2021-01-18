import { Script } from '../model';

export interface ForceBridgeRepository {
  getForceBridgeHistory: (lock: Script, pureCross: boolean) => Promise<[]>;
}
