import { Primitive, Server } from '@gliaswap/types';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import { Script, Cell, Amount, HashType, OutPoint } from '@lay2/pw-core';
import { createMockContext } from '@shopify/jest-koa-mocks';
import { Context } from 'koa';
import chai from 'chai';
chai.should();

import { ForgeCellService, ForgedCell, TxBuilderService } from '../../service';

class MockForgeCellService implements ForgeCellService {
  forgedCell: ForgedCell;

  constructor(cell: ForgedCell) {
    this.forgedCell = cell;
  }

  async forge(_ctx: Context, _capacity: Amount, _userLock: Script): Promise<ForgedCell> {
    return undefined;
  }

  async forgeToken(
    _ctx: Context,
    _capacity: Amount,
    _token: Primitive.Token,
    _userLock: Script,
    _extraCapacity: Amount,
  ): Promise<ForgedCell> {
    return this.forgedCell;
  }
}

describe('TxBuilderService', () => {
  const TEST_USER_LOCK = new Script(
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    '0x',
    HashType.type,
  );
  const TEST_TOKEN_TYPE_SCRIPT = new Script(
    '0x0000000000000000000000000000000000000000000000000000000000000002',
    '0x',
    HashType.type,
  );
  const TEST_TOKEN_TYPE_HASH = TEST_TOKEN_TYPE_SCRIPT.toHash();
  const TEST_POOL_ID = '0x0000000000000000000000000000000000000000000000000000000000000003';
  const TEST_TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000004';

  let txBuilderService: TxBuilderService;
  let mockForgedCell: ForgedCell;

  const generateForgedCell = (
    capacity: number,
    tokenAmount: number,
    changeCapacity: number,
    changeTokenAmount: number,
  ) => {
    const generateCell = (capacity: number, tokenAmount: number) => {
      const data = new Amount(tokenAmount.toString()).toUInt128LE();
      return new Cell(new Amount(capacity.toString()), TEST_USER_LOCK, TEST_TOKEN_TYPE_SCRIPT, undefined, data);
    };

    const forgedOutput = generateCell(capacity, tokenAmount);
    const changeOutput = generateCell(changeCapacity, changeTokenAmount);
    const inputs = (() => {
      const cells = [forgedOutput.clone(), changeOutput.clone()];
      return cells.map((cell) => {
        cell.outPoint = new OutPoint(TEST_TX_HASH, '0x0');
        return cell;
      });
    })();

    return {
      inputs,
      forgedOutput,
      changeOutput,
    };
  };

  const generateToken = (amount: number, typeHash: string, typeScript: Script) => {
    const token: Primitive.Token = {
      balance: amount.toString(),
      typeHash,
      typeScript,
      info: undefined,
    };

    return token;
  };

  describe('buildGenesisLiquidity()', () => {
    describe('with enough free ckb and free token', () => {
      beforeEach(async () => {
        mockForgedCell = generateForgedCell(1000, 200, 1000, 200);
        txBuilderService = new TxBuilderService(new MockForgeCellService(mockForgedCell));
      });

      it('return genesis liquidity order tx', async () => {
        const ctx = createMockContext();
        const req: Server.GenesisLiquidityRequest = {
          tokenAAmount: generateToken(1000, CKB_TYPE_HASH, undefined),
          tokenBAmount: generateToken(200, TEST_TOKEN_TYPE_HASH, TEST_TOKEN_TYPE_SCRIPT),
          poolId: TEST_POOL_ID,
          userLock: TEST_USER_LOCK,
        };

        await txBuilderService.buildGenesisLiquidity(ctx, req);
      });
    });
  });
});
