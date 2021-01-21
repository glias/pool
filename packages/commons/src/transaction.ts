import {
  Amount,
  Cell as PWCell,
  CellDep,
  DepType,
  HashType,
  OutPoint,
  RawTransaction as PWRawTransaction,
  Script as PWScript,
  Transaction as PWTransaction,
} from '@lay2/pw-core';
import { Script } from '.';

export type TransactionStatus = 'pending' | 'proposed' | 'committed';

export type CellLike = {
  capacity: CKBComponents.Capacity;
  lock: Script;
  type?: Script;
  data?: CKBComponents.Bytes;
};

export type InputCell = CellLike & {
  txHash: string;
  index: string;
};

export type OutputCell = CellLike;

export type SerializedTransaction = {
  inputCells: InputCell[];
  outputCells: OutputCell[];
  cellDeps: CKBComponents.RawTransactionToSign['cellDeps'];
  headerDeps: CKBComponents.RawTransactionToSign['headerDeps'];
  version: CKBComponents.RawTransactionToSign['version'];

  witnessArgs: CKBComponents.WitnessArgs[];
};

export type SerializedTransactionWithFee = {
  transaction: SerializedTransaction;
  fee: string;
};

function deserializeScript(script: Script): PWScript {
  const hashType = script.hashType === 'type' ? HashType.type : HashType.data;
  return new PWScript(script.codeHash, script.args, hashType);
}

function serializeScript(script: PWScript): CKBComponents.Script {
  return script.serializeJson() as CKBComponents.Script;
}

function deserializeInputCell(cell: InputCell): PWCell {
  return new PWCell(
    new Amount(cell.capacity),
    deserializeScript(cell.lock),
    cell.type && deserializeScript(cell.type),
    cell.txHash && cell.index ? new OutPoint(cell.txHash, cell.index) : undefined,
    cell.data,
  );
}

function serializeInputCell(cell: PWCell): InputCell {
  return cell.serializeJson() as InputCell;
}

function deserializeOutputCell(cell: OutputCell): PWCell {
  return new PWCell(
    new Amount(cell.capacity, 0),
    deserializeScript(cell.lock),
    cell.type && deserializeScript(cell.type),
    undefined,
    cell.data,
  );
}

function serializeOutputCell(cell: PWCell): OutputCell {
  return cell.serializeJson() as OutputCell;
}

function deserializeCellDeps(dep: CKBComponents.CellDep): CellDep {
  return new CellDep(
    dep.depType === 'depGroup' ? DepType.depGroup : DepType.code,
    new OutPoint(dep.outPoint!.txHash, dep.outPoint!.txHash),
  );
}

function serializeCellDep(dep: CellDep): CKBComponents.CellDep {
  return dep.serializeJson() as CKBComponents.CellDep;
}

function deserializeTransaction(serialized: SerializedTransaction): PWTransaction {
  const inputCells: PWCell[] = serialized.inputCells.map((cell) => deserializeInputCell(cell));
  const outputCells: PWCell[] = serialized.outputCells.map((cell) => deserializeOutputCell(cell));
  const cellDeps: CellDep[] = serialized.cellDeps.map(deserializeCellDeps);

  const raw = new PWRawTransaction(inputCells, outputCells, cellDeps, serialized.headerDeps, serialized.version);

  return new PWTransaction(
    raw,
    serialized.witnessArgs.map((arg) => ({
      input_type: arg.inputType!,
      lock: arg.lock!,
      output_type: arg.outputType!,
    })),
  );
}

function serializeTransaction(transaction: PWTransaction): SerializedTransaction {
  return transaction.serializeJson() as SerializedTransaction;
}

/**
 * serialize and deserialize between PW Transaction and plan object Transaction
 */
export const TransactionHelper = {
  deserializeCellDeps,
  deserializeOutputCell,
  deserializeInputCell,
  deserializeScript,
  deserializeTransaction,

  serializeCellDep,
  serializeScript,
  serializeOutputCell,
  serializeInputCell,
  serializeTransaction,
};
