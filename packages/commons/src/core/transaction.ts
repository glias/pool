import Script from './script';
import { HexString } from './primitive';

export interface OutPoint {
  txHash: HexString;
  index: HexString;
}

export interface CellInput {
  previousOutput: OutPoint;
  since: HexString;
}

export interface CellDep {
  depType: string;
  outPoint: OutPoint;
}

export interface CellOutput {
  capacity: HexString;
  lock: Script;
  type?: Script | null | undefined;
  data: HexString;
}

export interface WitnessArgs {
  inputType: HexString;
  lock: HexString;
  outputType: HexString;
}

export default class Transaction {
  inputs: CellInput[];
  outputs: CellOutput[];
  cellDeps: CellDep[];
  headerDeps: HexString[];
  version: HexString;
  witnessArgs: WitnessArgs[];
  hash?: HexString | null | undefined;
  witnesses: HexString[];
}
