import * as lumos from '@ckb-lumos/base';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import { Primitive } from '@gliaswap/types';
import { Amount, Cell, OutPoint, Script } from '@lay2/pw-core';

import * as model from '../model';

import { ckbRepository, DexRepository } from '../repository';

export interface TokenCellCollectorService {
  collect(token: Primitive.Token, userLock: Script): Promise<Array<Cell>>;

  collectFreeCkb(userLock: Script): Promise<Array<Cell>>;
}

export class DefaultTokenCellCollectorService implements TokenCellCollectorService {
  private readonly ckbRepository: DexRepository;

  constructor() {
    this.ckbRepository = ckbRepository;
  }

  public async collect(token: Primitive.Token, userLock: Script): Promise<Array<Cell>> {
    return token.typeHash == CKB_TYPE_HASH ? this.collectFreeCkb(userLock) : this.collectToken(token, userLock);
  }

  public async collectFreeCkb(userLock: Script): Promise<Array<Cell>> {
    const queryOptions: lumos.QueryOptions = {
      lock: this.toLumosScript(userLock),
    };
    const cells = await this.ckbRepository.collectCells(queryOptions);

    // Filter non-free ckb cells
    const freeCells = cells.filter((cell) => cell.data === '0x' && !cell.cellOutput.type);
    return freeCells.map(this.toPWCell);
  }

  private async collectToken(token: Primitive.Token, userLock: Script): Promise<Array<Cell>> {
    const queryOptions: lumos.QueryOptions = {
      lock: this.toLumosScript(userLock),
      type: this.toLumosScript(token.typeScript),
    };

    const cells = await this.ckbRepository.collectCells(queryOptions);
    return cells.map(this.toPWCell);
  }

  private toPWCell(cell: model.Cell): Cell {
    const capacity = new Amount(cell.cellOutput.capacity);
    const lock = model.cellConver.converToPWScript(cell.cellOutput.lock);
    const type = cell.cellOutput.type ? model.cellConver.converToPWScript(cell.cellOutput.type) : undefined;
    const outPoint = new OutPoint(cell.outPoint.txHash, cell.outPoint.index);
    return new Cell(capacity, lock, type, outPoint, cell.data);
  }

  private toLumosScript(script: Script): lumos.Script {
    return {
      code_hash: script.codeHash,
      hash_type: script.hashType,
      args: script.args,
    };
  }
}
