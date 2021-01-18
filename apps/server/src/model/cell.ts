/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as lumos from '@ckb-lumos/base';
import * as pw from '@lay2/pw-core';

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

export interface Script {
  codeHash: string;
  hashType: string;
  args: string;
}

export interface OutPoint {
  txHash: string;
  index: string;
}

class CellConver {
  conver(lumosCell: any): Cell {
    const cell: Cell = {
      cellOutput: {
        capacity: lumosCell.cell_output.capacity,
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

  converScript(lumosScript: lumos.Script): Script {
    if (!lumosScript) {
      return undefined;
    }

    const script = {
      codeHash: lumosScript.code_hash,
      hashType: lumosScript.hash_type,
      args: lumosScript.args,
    };

    return script;
  }

  converToPWScript(script: Script): pw.Script {
    return new pw.Script(script.codeHash, script.args, script.hashType == 'type' ? pw.HashType.type : pw.HashType.data);
  }
}

export const cellConver = new CellConver();
