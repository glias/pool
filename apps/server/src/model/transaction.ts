/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as lumos from '@ckb-lumos/base';
import * as ckbToolkit from 'ckb-js-toolkit';
import * as constants from '@gliaswap/constants';

import { Cell, cellConver, CellOutput, OutPoint } from '.';
import * as config from '../config';

export interface TransactionWithStatus {
  transaction: Transaction;
  txStatus: TxStatus;
}

export interface WitnessArgs {
  inputType: string;
  lock: string;
  outputType: string;
}

export interface RawTransaction {
  version: string;
  cellDeps: CellDep[];
  headerDeps: string[];
  inputs: Input[];
  outputs: Output[];
  outputsData: string[];
}

export class TransactionToSign {
  raw: RawTransaction;
  witnesses: string[];

  // Extra fields for pw transaction support
  inputCells: Cell[];
  witnessArgs: WitnessArgs[];

  constructor(raw: RawTransaction, inputCells: Cell[], witnessArgs: WitnessArgs[], witnessLengths: number[]) {
    this.raw = raw;
    this.inputCells = inputCells;
    this.witnessArgs = witnessArgs;

    this.witnesses = raw.inputs.map((_) => '0x');
    for (let i = 0; i < witnessLengths.length; i++) {
      this.witnesses[i] = '0x' + '0'.repeat(witnessLengths[i] - 2);
    }
    for (let i = 0; i < witnessArgs.length; i++) {
      const snakeWitnessArgs = ckbToolkit.transformers.TransformWitnessArgs(witnessArgs[i]);

      this.witnesses[i] = new ckbToolkit.Reader(
        lumos.core.SerializeWitnessArgs(ckbToolkit.normalizers.NormalizeWitnessArgs(snakeWitnessArgs)),
      ).serializeJson();
    }
  }

  size(): number {
    const tx = ckbToolkit.transformers.TransformTransaction({
      ...this.raw,
      witnesses: this.witnesses,
    });

    return lumos.core.SerializeTransaction(ckbToolkit.normalizers.NormalizeTransaction(tx)).byteLength + 4;
  }

  // Fee base to shannons
  calcFee(): bigint {
    const ratio = 1000n;
    const txSize = this.size();

    const base = BigInt(txSize) * BigInt(config.FEE_RATE);
    const fee = base / ratio;
    if (fee * ratio < base) {
      return fee + 1n;
    }
    return fee * constants.CKB_DECIMAL;
  }

  serialize(): Record<string, unknown> {
    const inputCells = this.inputCells.map(this.serializeInputCell);
    const outputCells = this.raw.outputs.map((output, idx) => {
      return {
        ...output,
        data: this.raw.outputsData[idx],
      };
    });
    const cellDeps = this.raw.cellDeps.map((cellDep) => {
      return {
        outPoint: cellDep.outPoint,
        depType: cellDep.depType == 'code' ? 'code' : 'depGroup',
      };
    });

    return {
      inputCells,
      outputCells,
      cellDeps,
      headerDeps: this.raw.headerDeps,
      version: this.raw.version,

      witnessArgs: this.witnessArgs,
    };
  }

  private serializeInputCell(cell: Cell): Record<string, unknown> {
    return {
      ...cell.cellOutput,
      ...cell.outPoint,
      data: cell.data,
    };
  }
}

export interface Transaction {
  cellDeps: CellDep[];
  hash?: string;
  headerDeps: string[];
  inputs: Input[];
  outputs: Output[];
  outputsData: string[];
  version: string;
  witnesses: string[];
}

export interface TxStatus {
  blockHash?: string;
  status: string;
  timestamp?: string;
}

export interface Input {
  previousOutput: OutPoint;
  since: string;
}

export type Output = CellOutput;

export interface CellDep {
  outPoint: OutPoint;
  depType: string;
}

class TransactionConver {
  conver(lumosTx: any): TransactionWithStatus {
    const tx: TransactionWithStatus = {
      transaction: {
        cellDeps: [],
        hash: lumosTx.transaction.hash,
        headerDeps: [],
        inputs: this.converInputs(lumosTx.transaction.inputs),
        outputs: this.converOutputs(lumosTx.transaction.outputs),
        outputsData:
          'outputsData' in lumosTx.transaction ? lumosTx.transaction.outputsData : lumosTx.transaction.outputs_data,
        version: lumosTx.transaction.version,
        witnesses: lumosTx.transaction.witnesses,
      },
      txStatus: {
        blockHash: 'txStatus' in lumosTx ? lumosTx.txStatus.blockHash : lumosTx.tx_status.block_hash,
        status: 'txStatus' in lumosTx ? lumosTx.txStatus.status : lumosTx.tx_status.status,
      },
    };

    return tx;
  }

  private converInputs(lumosInputs: any): Input[] {
    const inputs = lumosInputs.map((x) => {
      const input = {
        previousOutput: cellConver.converOutPoint('previousOutput' in x ? x.previousOutput : x.previous_output),
        since: x.since,
      };

      return input;
    });

    return inputs;
  }

  private converOutputs(lumosInputs: lumos.Output[]): Output[] {
    const outputs = lumosInputs.map((x) => {
      const output = {
        capacity: x.capacity,
        lock: cellConver.converScript(x.lock),
        type: cellConver.converScript(x.type),
      };

      return output;
    });

    return outputs;
  }
}

export const transactionConver = new TransactionConver();
