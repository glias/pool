import { ICellCollector, OrderBuilder } from './';
import { Server } from '@gliaswap/types';
import { MIN_SUDT_CAPACITY } from '@gliaswap/constants';
import { Script, Cell, Amount, HashType } from '@lay2/pw-core';
import { createMockContext } from '@shopify/jest-koa-mocks';
import chai from 'chai';
chai.should();

class MockCellCollector implements ICellCollector {
  cells: Array<Cell>;

  constructor(cells: Array<Cell>) {
    this.cells = cells;
  }

  async collect(_tokenAmount: Server.Token, _userLock: Script): Promise<Array<Cell>> {
    return this.cells;
  }
}

describe('OrderBuilder service', () => {
  const mockUserLock = new Script('0x00000000000000000000000000000000', '0x00', HashType.type);
  const mockTokenTypeScript = new Script('0x00000000000000000000000000000001', '0x00', HashType.type);

  let orderBuilder: OrderBuilder;
  let mockInputCells: Array<Cell>;

  const generateCell = (capacity: number, tokenAmount: number) => {
    const cellCapacaity = new Amount(MIN_SUDT_CAPACITY.toString()).add(new Amount(capacity.toString()));

    let cell = new Cell(cellCapacaity, mockUserLock, mockTokenTypeScript);
    cell.setHexData(new Amount(tokenAmount.toString()).toUInt128LE());

    return cell;
  };

  const generateToken = (amount: number) => {
    const token: Server.Token = {
      balance: amount.toString(),
      typeHash: '0x000',
      typeScript: mockTokenTypeScript,
      info: undefined,
    };

    return token;
  };

  describe('forgeCell()', () => {
    describe('with enough free ckb and free sudt', () => {
      beforeEach(async () => {
        mockInputCells = [generateCell(200 + MIN_SUDT_CAPACITY, 200)];
        orderBuilder = new OrderBuilder(new MockCellCollector(mockInputCells));
      });
      it('returns input cells, forged output cell and change output cell', async () => {
        const ctx = createMockContext();
        const result = await orderBuilder.forgeCell(
          ctx,
          new Amount('100').add(new Amount(MIN_SUDT_CAPACITY.toString())),
          generateToken(100),
          mockUserLock,
        );

        const expectedForgedCell = generateCell(100, 100);
        const expectedChangeCell = generateCell(100, 100);

        result.inputs.should.be.deep.equal(mockInputCells);
        result.forgedOutput.should.be.deep.equal(expectedForgedCell);
        result.changeOutput.should.be.deep.equal(expectedChangeCell);
      });
    });
  });
});
