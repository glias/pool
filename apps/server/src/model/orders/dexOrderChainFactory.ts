import { BridgeInfoMatchChain, Input, Script, scriptEquals, TransactionWithStatus } from '..';
import { DexLiquidityChain } from './dexLiquidityOrderChain';
import { DexOrderChain } from './dexOrderChain';
import { DexSwapOrderChain } from './dexSwapOrderChain';
import * as lumos from '@ckb-lumos/base';
import { SWAP_ORDER_LOCK_CODE_HASH } from '../../config';

export class DexOrderChainFactory {
  private inputOutPointWithTransaction: Map<string, TransactionWithStatus>;
  private orderCells: DexOrderChain[];
  private readonly markTheCellThatHasBeenTracked: Set<string>;
  private readonly isSwapOrder: boolean;

  constructor(isSwapOrder: boolean) {
    this.isSwapOrder = isSwapOrder;
    this.markTheCellThatHasBeenTracked = new Set();
  }

  getOrderChains(
    lock: Script | (lumos.Script | lumos.ScriptWrapper),
    type: Script,
    transactionCollector: TransactionWithStatus[],
    bridgeInfoMatch: BridgeInfoMatchChain,
  ): DexOrderChain[] {
    const orders = [];

    this.initOrderChainDatas(lock, type, transactionCollector, bridgeInfoMatch);
    this.orderCells.forEach((x) => {
      const inputOutPoint = this.formatOutPoint(x.tx.transaction.hash, x.index);
      if (this.markTheCellThatHasBeenTracked.has(inputOutPoint)) {
        return;
      }

      const order = this.buildOrderChain(x);
      orders.push(order);
    });

    return orders;
  }

  buildOrderChain(orderCell: DexOrderChain): DexOrderChain {
    const inputOutPoint = this.formatOutPoint(orderCell.tx.transaction.hash, orderCell.index);
    this.markTheCellThatHasBeenTracked.add(inputOutPoint);

    const nextTx = this.inputOutPointWithTransaction.get(inputOutPoint);
    if (!nextTx) {
      orderCell.live = true;
      return orderCell;
    }

    const nextCell = this.matchNextOrderCell(nextTx, inputOutPoint);
    orderCell.nextOrderCell = nextCell;
    if (!this.nextCellIsOrderCell(orderCell, nextCell)) {
      return orderCell;
    }

    this.buildOrderChain(nextCell);
    return orderCell;
  }

  private nextCellIsOrderCell(orderCell: DexOrderChain, nextCell: DexOrderChain): boolean {
    return orderCell.equals(nextCell);
  }

  private matchNextOrderCell(nextTx: TransactionWithStatus, targetInputOutPoint: string): DexOrderChain {
    const index = this.matchIndexOfInputInArray(nextTx.transaction.inputs, targetInputOutPoint);
    const output = nextTx.transaction.outputs[index];
    const data = nextTx.transaction.outputsData[index];

    return this.isSwapOrder
      ? new DexSwapOrderChain(output, data, nextTx, index, false, null)
      : new DexLiquidityChain(output, data, nextTx, index, false, null);
  }

  private matchIndexOfInputInArray(inputs: Input[], targetInputOutPoint: string): number {
    for (let i = 0; i < inputs.length; i++) {
      const { txHash, index } = inputs[i].previousOutput;
      const inputOutPoint = this.formatOutPoint(txHash, parseInt(index, 16));
      if (inputOutPoint === targetInputOutPoint) {
        return i;
      }
    }
  }

  private initOrderChainDatas(
    lock: Script | (lumos.Script | lumos.ScriptWrapper),
    type: Script,
    transactionCollector: TransactionWithStatus[],
    bridgeInfoMatch: BridgeInfoMatchChain,
  ): void {
    const inputOutPointWithTransaction: Map<string, TransactionWithStatus> = new Map();
    const orderCells: DexOrderChain[] = [];

    transactionCollector.forEach((x) => {
      x.transaction.inputs.forEach((input) => {
        const key = this.formatOutPoint(input.previousOutput.txHash, parseInt(input.previousOutput.index, 16));
        inputOutPointWithTransaction.set(key, x);
      });

      const hasSwapCodeHash = x.transaction.outputs.find((x) => x.lock.codeHash === SWAP_ORDER_LOCK_CODE_HASH);

      x.transaction.outputs.forEach((output, index) => {
        // swap order lock args: user_lock_hash (32 bytes, 0..32) | version (u8, 1 byte, 32..33) | sudtMin (u128, 16 bytes, 33..49) | ckbMin (u64, 8 bytes, 49..57) | info_type_hash_32 (32 bytes, 57..89) | tips (8 bytes, 89..97) | tips_sudt (16 bytes, 97..113)
        // argsLen = 228
        if (!this.isSwapOrder && output.lock.args.length !== 228) {
          return;
        }

        // liquidity order lock args: user_lock_hash (32 bytes, 0..32) | version (u8, 1 byte, 32..33) | amountOutMin (u128, 16 bytes, 33..49) | sudt_type_hash (32 bytes, 49..81) | tips (8 bytes, 81..89) | tips_sudt (16 bytes, 89..105)
        // argsLen = 212
        if (hasSwapCodeHash && output.lock.args.length !== 212) {
          return;
        }

        if (type && !scriptEquals.equalsTypeScript(type, output.type)) {
          return;
        }

        if (!scriptEquals.matchLockScriptWapper(lock, output.lock)) {
          return;
        }

        const data = x.transaction.outputsData[index];
        const bridgeInfoResult = bridgeInfoMatch ? bridgeInfoMatch.match(x.transaction.hash) : null;
        const isIn = bridgeInfoResult ? bridgeInfoResult.isIn : null;
        const isOrder = bridgeInfoResult ? bridgeInfoResult.isOrder : null;
        const bridgeInfo = bridgeInfoResult ? bridgeInfoResult.bridgeInfo : null;
        const order = this.isSwapOrder
          ? new DexSwapOrderChain(output, data, x, index, false, null, isIn, isOrder, bridgeInfo)
          : new DexLiquidityChain(output, data, x, index, false, null);

        orderCells.push(order);
      });
    });

    this.inputOutPointWithTransaction = inputOutPointWithTransaction;
    this.orderCells = orderCells;
  }

  formatOutPoint(txHash: string, index: number): string {
    return `${txHash}:${index.toString(16)}`;
  }
}
