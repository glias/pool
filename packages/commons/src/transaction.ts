import { Amount, Cell, CellDep, DepType, HashType, OutPoint, RawTransaction, Script, Transaction } from '@lay2/pw-core';

export type TransactionStatus = 'pending' | 'proposed' | 'committed';

export type CellLike = {
  capacity: CKBComponents.Capacity;
  lock: Script;
  type?: Script | null;
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

function deserializeScript(script: CKBComponents.Script): Script {
  const hashType = script.hashType === 'type' ? HashType.type : HashType.data;
  return new Script(script.codeHash, script.args, hashType);
}

function serializeScript(script: Script): CKBComponents.Script {
  return script.serializeJson() as CKBComponents.Script;
}

function deserializeInputCell(cell: InputCell): Cell {
  return new Cell(
    new Amount(cell.capacity),
    deserializeScript(cell.lock),
    cell.type && deserializeScript(cell.type),
    cell.txHash && cell.index && new OutPoint(cell.txHash, cell.index),
    cell.data,
  );
}

function serializeInputCell(cell: Cell): InputCell {
  return cell.serializeJson() as InputCell;
}

function deserializeOutputCell(cell: OutputCell): Cell {
  return new Cell(
    new Amount(cell.capacity, 0),
    deserializeScript(cell.lock),
    cell.type && deserializeScript(cell.type),
    undefined,
    cell.data,
  );
}

function serializeOutputCell(cell: Cell): OutputCell {
  return cell.serializeJson() as OutputCell;
}

function deserializeCellDeps(dep: CKBComponents.CellDep): CellDep {
  return new CellDep(
    dep.depType === 'depGroup' ? DepType.depGroup : DepType.code,
    new OutPoint(dep.outPoint.txHash, dep.outPoint.txHash),
  );
}

function serializeCellDep(dep: CellDep): CKBComponents.CellDep {
  return dep.serializeJson() as CKBComponents.CellDep;
}

function deserializeTransaction(serialized: SerializedTransaction): Transaction {
  const inputCells: Cell[] = serialized.inputCells.map((cell) => deserializeInputCell(cell));
  const outputCells: Cell[] = serialized.outputCells.map((cell) => deserializeOutputCell(cell));
  const cellDeps: CellDep[] = serialized.cellDeps.map(deserializeCellDeps);

  const raw = new RawTransaction(inputCells, outputCells, cellDeps, serialized.headerDeps, serialized.version);
  return new Transaction(
    raw,
    serialized.witnessArgs.map((arg) => ({
      input_type: arg.inputType,
      lock: arg.lock,
      output_type: arg.outputType,
    })),
  );
}

function serializeTransaction(transaction: Transaction): SerializedTransaction {
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
