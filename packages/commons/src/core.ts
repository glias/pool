export interface OutPoint {
  txHash: string;
  index: string;
}

export interface CellOutput {
  capacity: string;
  lock: Script;
  type?: Script;
}

export class Script {
  codeHash: string;
  hashType: string;
  args: string;
}
