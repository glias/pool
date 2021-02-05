/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as lumos from '@ckb-lumos/base';
import * as ckbToolkit from 'ckb-js-toolkit';
import * as pw from '@lay2/pw-core';

import { Input } from '.';

export interface Cell {
  cellOutput: CellOutput;
  outPoint: OutPoint;
  blockHash: string;
  blockNumber: string;
  data: string;
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

  constructor(codeHash: string, hashType: string, args: string) {
    // Validate
    ckbToolkit.validators.ValidateScript({
      code_hash: codeHash,
      hash_type: hashType,
      args: args,
    });

    this.codeHash = codeHash;
    this.hashType = hashType;
    this.args = args;
  }

  toLumosScript(): lumos.Script {
    return {
      code_hash: this.codeHash,
      hash_type: <lumos.HashType>this.hashType,
      args: this.args,
    };
  }

  toPwScript(): pw.Script {
    return new pw.Script(this.codeHash, this.args, <pw.HashType>this.hashType);
  }

  toHash(): string {
    return lumos.utils.computeScriptHash(this.toLumosScript());
  }

  size(): number {
    const codeHashSize = Buffer.from(this.codeHash.slice(2), 'hex').byteLength;
    const hashTypeSize = 1;
    const argsSize = Buffer.from(this.args.slice(2), 'hex').byteLength;

    return codeHashSize + hashTypeSize + argsSize;
  }

  static deserialize(value: any): Script {
    // TransformScript already verify script for us
    const script = <any>ckbToolkit.transformers.TransformScript(value, { validation: true });
    return new Script(script.code_hash, script.hash_type, script.args);
  }
}

export interface OutPoint {
  txHash: string;
  index: string;
}

class CellConver {
  conver(lumosCell: any): Cell {
    const cell: Cell = {
      cellOutput: {
        capacity: 'cellOutput' in lumosCell ? lumosCell.cellOutput.capacity : lumosCell.cell_output.capacity,
        lock: this.converScript('cellOutput' in lumosCell ? lumosCell.cellOutput.lock : lumosCell.cell_output.lock),
        type: this.converScript('cellOutput' in lumosCell ? lumosCell.cellOutput.type : lumosCell.cell_output.type),
      },
      outPoint: this.converOutPoint('outPoint' in lumosCell ? lumosCell.outPoint : lumosCell.out_point),
      blockHash: 'blockHash' in lumosCell ? lumosCell.blockHash : lumosCell.block_hash,
      blockNumber: 'blockNumber' in lumosCell ? lumosCell.blockNumber : lumosCell.block_number,
      data: lumosCell.data,
    };

    return cell;
  }

  converOutPoint(lumosOutPoint: any): OutPoint {
    const outPoint = {
      txHash: 'txHash' in lumosOutPoint ? lumosOutPoint.txHash : lumosOutPoint.tx_hash,
      index: lumosOutPoint.index,
    };

    return outPoint;
  }

  converScript(lumosScript: any): Script {
    if (!lumosScript) {
      return undefined;
    }
    if ('codeHash' in lumosScript) {
      return new Script(lumosScript.codeHash, lumosScript.hashType, lumosScript.args);
    }
    return new Script(lumosScript.code_hash, lumosScript.hash_type, lumosScript.args);
  }

  converToInput(cell: Cell, since = '0x0'): Input {
    return {
      previousOutput: cell.outPoint,
      since,
    };
  }

  converToPWScript(script: Script): pw.Script {
    return new pw.Script(script.codeHash, script.args, script.hashType == 'type' ? pw.HashType.type : pw.HashType.data);
  }
}

export const cellConver = new CellConver();
