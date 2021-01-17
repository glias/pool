/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as lumos from '@ckb-lumos/base';
import { cellConver, CellOutput, OutPoint } from '.';

export interface TransactionWithStatus {
  transaction: Transaction;
  txStatus: TxStatus;
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
        outputsData: 'outputsData' in lumosTx ? lumosTx.transaction.outputsData : lumosTx.transaction.outputs_data,
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
