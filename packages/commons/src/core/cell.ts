import * as pw from '@lay2/pw-core';

import { Script, IScript, HexString } from './';

export interface ICell {
  capacity: string;
  lock: IScript;
  type?: IScript | null | undefined;
  data?: HexString | null | undefined;
}

export class Cell implements ICell {
  constructor(public capacity: string, public lock: Script, public type?: Script, public data?: HexString) {
    this.capacity = capacity;
    this.lock = lock;
    this.type = type;
    this.data = data;
  }

  static fromPw(pwCell: pw.Cell): Cell {
    const { capacity, lock } = pwCell;
    const data = pwCell.getHexData();
    const type = pwCell.type ? Script.fromPw(pwCell.type) : undefined;

    return new Cell(capacity.toString(), Script.fromPw(lock), type, data);
  }

  static fromJson(jsonCell: ICell): Cell {
    const { capacity, lock, data } = jsonCell;
    const type = jsonCell.type ? Script.fromJson(jsonCell.type) : undefined;

    return new Cell(capacity, Script.fromJson(lock), type, data);
  }

  static fromLumos(lumosCell: any): Cell {
    const capacity = 'cellOutput' in lumosCell ? lumosCell.cellOutput.capacity : lumosCell.cell_output.capacity;
    const lock = Script.fromLumos('cellOutput' in lumosCell ? lumosCell.cellOutput.lock : lumosCell.cell_output.lock);
    const type = (() => {
      const t = 'cellOutput' in lumosCell ? lumosCell.cellOutput.type : lumosCell.cell_output.type;
      return t ? Script.fromLumos(t) : undefined;
    })();
    const data = lumosCell.data;

    return new Cell(capacity, lock, type, data);
  }

  toPw(): pw.Cell {
    return new pw.Cell(
      new pw.Amount(this.capacity),
      this.lock.toPw(),
      this.type ? this.type.toPw() : undefined,
      undefined,
      this.data,
    );
  }

  toJson(): ICell {
    return {
      ...this,
    };
  }
}
