import * as lumos from '@ckb-lumos/base';
import { Context } from 'koa';

import { Cell, Script, Token, CellInfoSerializationHolderFactory, SudtCellSerialization } from '../../model';
import { ckbRepository, DexRepository } from '../../repository';

export interface CollectedCells {
  inputCells: Cell[];
  inputCapacity: bigint;
  inputToken?: bigint;
}

export interface MultiCollectedCells {
  inputCells: Cell[];
  inputCapacity: bigint;
  inputTokens?: bigint[];
}

export interface CellCollector {
  collect(ctx: Context, capacity: bigint, userLock: Script, token?: Token): Promise<CollectedCells>;

  // Collect multiple tokens
  multiCollect(ctx: Context, capacity: bigint, userLock: Script, tokens?: Token[]): Promise<MultiCollectedCells>;
}

export class TxBuilderCellCollector implements CellCollector {
  private readonly ckbRepository: DexRepository;
  private readonly codec: SudtCellSerialization;
  private warningMessage = `You don't have enough live cells to complete this transaction, please wait for other transactions to be completed.`;

  constructor() {
    this.ckbRepository = ckbRepository;
    this.codec = CellInfoSerializationHolderFactory.getInstance().getSudtCellSerialization();
  }

  collect = async (ctx: Context, capacity: bigint, userLock: Script, token?: Token): Promise<CollectedCells> => {
    const inputCells: Array<Cell> = [];
    let inputToken = 0n;
    let inputCapacity = 0n;

    if (token && token.getBalance() != 0n) {
      const collection = await this.collectFreeToken(ctx, token, userLock);

      inputCells.push(...collection.inputCells);
      inputCapacity = inputCapacity + collection.inputCapacity;
      inputToken = collection.inputToken;
    }

    if (inputCapacity < capacity) {
      const collection = await this.collectFreeCkb(ctx, capacity - inputCapacity, userLock);

      inputCapacity = inputCapacity + collection.inputCapacity;
      inputCells.push(...collection.inputCells);
    }

    return {
      inputCells,
      inputCapacity,
      inputToken: inputToken != 0n ? inputToken : null,
    };
  };

  multiCollect = async (
    ctx: Context,
    capacity: bigint,
    userLock: Script,
    tokens?: Token[],
  ): Promise<MultiCollectedCells> => {
    const inputCells: Array<Cell> = [];
    const inputTokens = [];
    let inputCapacity = 0n;

    if (tokens) {
      for (const token of tokens) {
        if (token.getBalance() == 0n) {
          inputTokens.push(0n);
          continue;
        }

        const collection = await this.collectFreeToken(ctx, token, userLock);

        inputCells.push(...collection.inputCells);
        inputCapacity = inputCapacity + collection.inputCapacity;
        inputTokens.push(collection.inputToken);
      }
    }

    if (inputCapacity < capacity) {
      const collection = await this.collectFreeCkb(ctx, capacity - inputCapacity, userLock);

      inputCapacity = inputCapacity + collection.inputCapacity;
      inputCells.push(...collection.inputCells);
    }

    return {
      inputCells,
      inputCapacity,
      inputTokens,
    };
  };

  private collectFreeToken = async (ctx: Context, token: Token, userLock: Script): Promise<CollectedCells> => {
    let inputCapacity = 0n;
    let inputToken = 0n;
    const inputCells: Cell[] = [];

    const queryOptions: lumos.QueryOptions = {
      lock: userLock.toLumosScript(),
      type: token.typeScript.toLumosScript(),
    };

    const cells = await this.ckbRepository.collectCells(queryOptions);
    for (const cell of cells) {
      if (inputToken >= token.getBalance()) {
        break;
      }

      inputCells.push(cell);
      inputCapacity = inputCapacity + BigInt(cell.cellOutput.capacity);
      inputToken = inputToken + this.codec.decodeData(cell.data);
    }
    if (inputToken < token.getBalance()) {
      ctx.throw(400, this.warningMessage);
    }

    return {
      inputCells,
      inputCapacity,
      inputToken,
    };
  };

  private collectFreeCkb = async (ctx: Context, amount: bigint, userLock: Script): Promise<CollectedCells> => {
    const inputCells: Cell[] = [];
    let inputCapacity = 0n;

    const queryOptions: lumos.QueryOptions = {
      lock: userLock.toLumosScript(),
    };
    const cells = await this.ckbRepository.collectCells(queryOptions);

    // Filter non-free ckb cells
    const freeCells = cells.filter((cell) => cell.data === '0x' && !cell.cellOutput.type);
    for (const cell of freeCells) {
      if (inputCapacity >= amount) {
        break;
      }

      inputCells.push(cell);
      inputCapacity = inputCapacity + BigInt(cell.cellOutput.capacity);
    }
    if (inputCapacity < amount) {
      ctx.throw(400, this.warningMessage);
    }

    return {
      inputCells,
      inputCapacity,
    };
  };
}
