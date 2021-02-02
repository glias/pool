import { Input, CellOutput, TransactionWithStatus, Script } from '../../src/model';

export const genTx = (
  hash: string,
  inputs: Input[],
  outputs: CellOutput[],
  outputsData: string[],
  status = 'committed',
): TransactionWithStatus => {
  return {
    transaction: {
      cellDeps: [],
      hash: hash,
      headerDeps: [],
      inputs: inputs,
      outputs: outputs,
      outputsData: outputsData,
      version: '0x0',
      witnesses: [],
    },
    txStatus: {
      blockHash: '0x977aa9a6ba5559f6a338c606e6676a99b420663fef4990b7ab25bdb9e01fbc4c',
      status: status,
      timestamp: '1611493825117',
    },
  };
};

export const genInput = (txHash: string, index: number): Input => {
  return {
    previousOutput: {
      index: `0x${index.toString(16)}`,
      txHash: txHash,
    },
    since: '0x0',
  };
};

export const genCellOutput = (capacity: bigint, lock: Script, type: Script): CellOutput => {
  return {
    capacity: `0x${capacity.toString(16)}`,
    lock: lock,
    type: type,
  };
};
