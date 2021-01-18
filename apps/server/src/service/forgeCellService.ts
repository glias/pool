import { Cell, Amount, Script } from '@lay2/pw-core';
import { Primitive } from '@gliaswap/types';
import { CKB_TYPE_HASH, MIN_SUDT_CAPACITY } from '@gliaswap/constants';
import { Context } from 'koa';

import { TokenCellCollectorService, DefaultTokenCellCollectorService } from '.';

interface ForgedCell {
  inputs: Array<Cell>;
  forgedOutput: Cell;
  changeOutput: Cell;
}

export interface ForgeCellService {
  forge(ctx: Context, capacity: Amount, userLock: Script): Promise<ForgedCell>;

  forgeToken(
    ctx: Context,
    capacity: Amount,
    token: Primitive.Token,
    userLock: Script,
    extraCapacity: Amount,
  ): Promise<ForgedCell>;
}

export class DefaultForgeCellService implements ForgeCellService {
  private readonly tokenCellCollectorService: TokenCellCollectorService;

  constructor(service?: TokenCellCollectorService) {
    this.tokenCellCollectorService = service ? service : new DefaultTokenCellCollectorService();
  }

  async forge(
    ctx: Context,
    capacity: Amount,
    userLock: Script,
    extraCapacity: Amount = Amount.ZERO,
  ): Promise<ForgedCell> {
    let inputs: Array<Cell> = [];
    let inputCapacity = Amount.ZERO;

    const minOutputCapacity = capacity.add(extraCapacity);
    const neededCapacity: Primitive.Token = {
      balance: capacity.add(extraCapacity).toString(),
      typeHash: CKB_TYPE_HASH,
      typeScript: undefined,
      info: undefined,
    };
    const ckbLiveCells = await this.tokenCellCollectorService.collect(neededCapacity, userLock);
    ckbLiveCells.forEach((cell) => {
      if (inputCapacity.lte(minOutputCapacity)) {
        inputs.push(cell);
        inputCapacity = inputCapacity.add(cell.capacity);
      }
    });
    if (inputCapacity.lt(minOutputCapacity)) {
      ctx.throw('free ckb not enough', 400, { required: minOutputCapacity.toString() });
    }

    const forgedCell = new Cell(capacity, userLock);
    const changeCell = new Cell(inputCapacity.sub(capacity), userLock);

    return {
      inputs,
      forgedOutput: forgedCell,
      changeOutput: changeCell,
    };
  }

  // TODO: check token.script exists
  // FIXME: make sure that capacity is bigger or equal than MIN_SUDT_CAPACITY
  async forgeToken(
    ctx: Context,
    capacity: Amount,
    token: Primitive.Token,
    userLock: Script,
    extraCapacity: Amount = Amount.ZERO,
  ): Promise<ForgedCell> {
    let inputs: Array<Cell> = [];
    let inputTokenAmount = Amount.ZERO;
    let inputCapacity = Amount.ZERO;
    const tokenAmount = new Amount(token.balance);

    const tokenLiveCells = await this.tokenCellCollectorService.collect(token, userLock);
    tokenLiveCells.forEach((cell) => {
      inputTokenAmount = inputTokenAmount.add(cell.getSUDTAmount());
      inputs.push(cell);
      inputCapacity = inputCapacity.add(cell.capacity);
    });
    if (inputTokenAmount.lt(tokenAmount)) {
      ctx.throw('free sudt not enough', 400, { required: token.balance });
    }

    let minOutputCapacity = capacity.add(extraCapacity);
    const hasTokenChange = inputTokenAmount.gt(new Amount(token.balance));
    if (hasTokenChange) {
      // Need to generate a sudt change output cell
      // FIXME: MIN_SUDT_CAPACITY can be wrong size, since user lock args may not be 32 bytes or
      // sudt data size may not be 16 bytes.
      minOutputCapacity = minOutputCapacity.add(new Amount(MIN_SUDT_CAPACITY.toString()));
    }

    // More capacities to ensure that we can cover extraCapacity
    if (inputCapacity.lte(minOutputCapacity)) {
      const extraNeededCapacity: Primitive.Token = {
        balance: minOutputCapacity.sub(inputCapacity).toString(),
        typeHash: CKB_TYPE_HASH,
        typeScript: undefined,
        info: undefined,
      };
      const ckbLiveCells = await this.tokenCellCollectorService.collect(extraNeededCapacity, userLock);
      ckbLiveCells.forEach((cell) => {
        if (inputCapacity.lte(minOutputCapacity)) {
          inputs.push(cell);
          inputCapacity = inputCapacity.add(cell.capacity);
        }
      });
    }
    if (inputCapacity.lt(minOutputCapacity)) {
      ctx.throw('free ckb not enough', 400, { required: minOutputCapacity.toString() });
    }

    const forgedCell = new Cell(capacity, userLock, token.typeScript, undefined, tokenAmount.toUInt128LE());

    let changeCell: Cell;
    const changeCapacity = inputCapacity.sub(capacity);
    if (hasTokenChange) {
      changeCell = new Cell(changeCapacity, userLock, token.typeScript);
      changeCell.setHexData(inputTokenAmount.sub(tokenAmount).toUInt128LE());
    } else {
      changeCell = new Cell(changeCapacity, userLock);
    }

    return {
      inputs,
      forgedOutput: forgedCell,
      changeOutput: changeCell,
    };
  }
}
