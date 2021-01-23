export interface BridgeInfo {
  id: number;
  eth_tx_hash: string;
  ckb_tx_hash: string;
  status: string;
  sort: string;
  amount: string;
  token_addr: string;
}

export class BridgeInfoMatchResult {
  isOrder: boolean;
  isIn: boolean;
  bridgeInfo: BridgeInfo;

  constructor(isOrder: boolean, isIn: boolean, bridgeInfo: BridgeInfo) {
    this.isOrder = isOrder;
    this.isIn = isIn;
    this.bridgeInfo = bridgeInfo;
  }
}

export class BridgeInfoMatchChain {
  private handles: ChainHandle[] = [];
  private index = 0;

  constructor(handles: ChainHandle[]) {
    this.handles = handles;
  }

  match(txHash: string): BridgeInfoMatchResult {
    if (this.index >= this.handles.length) {
      return null;
    }
    const result = this.handles[this.index++].match(this, txHash);
    if (result || this.index === this.handles.length) {
      this.reset();
    }
    return result;
  }

  private reset(): void {
    this.index = 0;
  }
}

export class ChainHandle {
  constructor(
    private readonly isOrder: boolean,
    private readonly isIn: boolean,
    private readonly bridgeInfos: BridgeInfo[],
  ) {}

  match(chain: BridgeInfoMatchChain, txHash: string): BridgeInfoMatchResult {
    const result = this.handelProcess(txHash);
    if (result) {
      return result;
    }
    return chain.match(txHash);
  }

  protected handelProcess(txHash: string): BridgeInfoMatchResult {
    const bridgeInfo = this.bridgeInfos.find((x) => x.ckb_tx_hash === txHash);
    if (bridgeInfo) {
      return new BridgeInfoMatchResult(this.isOrder, this.isIn, bridgeInfo);
    }
    return null;
  }
}

export class BridgeInfoMatchChainFactory {
  static getInstance(
    pureCrossTxs: { eth_to_ckb: BridgeInfo[]; ckb_to_eth: BridgeInfo[] },
    crossChainOrderTxs: { eth_to_ckb: BridgeInfo[]; ckb_to_eth: BridgeInfo[] },
  ): BridgeInfoMatchChain {
    const handels: ChainHandle[] = [];
    handels.push(new ChainHandle(false, false, pureCrossTxs.ckb_to_eth));
    handels.push(new ChainHandle(false, true, pureCrossTxs.eth_to_ckb));
    handels.push(new ChainHandle(true, false, crossChainOrderTxs.ckb_to_eth));
    handels.push(new ChainHandle(true, true, crossChainOrderTxs.eth_to_ckb));

    return new BridgeInfoMatchChain(handels);
  }
}
