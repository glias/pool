import { BridgeInfo, Script } from '../model';

export interface ForceBridgeRepository {
  getForceBridgeHistory: (
    lock: Script,
    ethAddress: string,
    pureCross: boolean,
  ) => Promise<{
    eth_to_ckb: BridgeInfo[];
    ckb_to_eth: BridgeInfo[];
  }>;
}
