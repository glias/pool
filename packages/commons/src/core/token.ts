import * as pw from '@lay2/pw-core';
import { CKB_TYPE_HASH } from '@gliaswap/constants';

import { HexString, IScript, Script, Cell, ICell } from './';

export type Amount = pw.Amount;

export interface TokenInfo {
  name: string;
  symbol: string;
  decimal: number;
  logoUri: string;
}

export interface IToken {
  typeHash: HexString;
  typeScript?: IScript | null | undefined;
  info?: TokenInfo | null | undefined;
  balance: string;
}

export class Token implements IToken {
  constructor(public typeHash: HexString, public balance: string, public typeScript?: Script, public info?: TokenInfo) {
    this.typeHash = typeHash;
    this.typeScript = typeScript;
    this.info = info;
    this.balance = balance;
  }

  static fromJson(jsonToken: IToken): Token {
    return new Token(jsonToken.typeHash, jsonToken.balance, Script.fromJson(jsonToken.typeScript), jsonToken.info);
  }

  static fromCell(cell: Cell, info?: TokenInfo): Token {
    const typeHash = cell.type ? cell.type.toHash() : CKB_TYPE_HASH;
    const balance = cell.type ? cell.toPw().getSUDTAmount().toString() : cell.capacity;

    return new Token(typeHash, balance, cell.type, info);
  }

  static fromICell(jsonCell: ICell, info?: TokenInfo): Token {
    return Token.fromCell(Cell.fromJson(jsonCell), info);
  }

  toJson(): IToken {
    return {
      ...this,
    };
  }

  toCell(lock: Script, capacity?: string): Cell {
    if (!this.isCkb()) {
      throw 'need capacity for token cell';
    }

    const cellCapacity = this.isCkb() ? this.balance : capacity;
    const cellData = this.isCkb() ? undefined : new pw.Amount(this.balance).toUInt128LE();

    return new Cell(cellCapacity, lock, this.typeScript, cellData);
  }

  isCkb(): boolean {
    return this.typeHash == CKB_TYPE_HASH;
  }

  amount(): Amount {
    return new pw.Amount(this.balance);
  }
}
