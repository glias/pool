import { CKB_TYPE_HASH, MIN_SUDT_CAPACITY } from '@gliaswap/constants';
import {
  Output,
  TransactionWithStatus,
  SwapOrderCellArgs,
  CellInfoSerializationHolderFactory,
  Script,
  Token,
} from '..';
import { CKB_TOKEN_TYPE_HASH, FORCE_BRIDGE_LOCK_HASH_CODE } from '../../config';
import * as utils from '../../utils';
import { BridgeInfo } from '../bridge';
import { PoolInfoFactory, QuoteBase } from '../pool';
import { TokenHolderFactory } from '../tokens';
import { DexOrderChain, OrderHistory, ORDER_STATUS, Step } from './dexOrderChain';

export enum ORDER_TYPE {
  SellCKB = 0,
  BuyCKB = 1,
}

export enum SWAP_ORDER_TYPE {
  CrossChain = 'CrossChain',
  CrossChainOrder = 'CrossChainOrder',
  Order = 'Order',
}

export class DexSwapOrderChain extends DexOrderChain {
  constructor(
    userLock: Script,
    cell: Output,
    data: string,
    tx: TransactionWithStatus,
    index: number,
    live: boolean,
    nextOrderCell: DexOrderChain,
    private readonly _isIn?: boolean,
    private readonly _isOrder?: boolean,
    private readonly _bridgeInfo?: BridgeInfo,
  ) {
    super(userLock, cell, data, tx, index, nextOrderCell, live);
  }

  getOrderHistory(): OrderHistory {
    const transactionHash = this.getLastOrder().getTxHash();

    const amountIn = this.tokenA();
    const amountOut = this.tokenB();
    if (this.getType() === SWAP_ORDER_TYPE.CrossChain) {
      if (this._isIn) {
        amountIn.balance = this._bridgeInfo.amount;
        amountOut.balance = this._bridgeInfo.amount;
      } else {
        amountIn.balance = this._bridgeInfo.amount;
        amountOut.balance = this._bridgeInfo.amount;
      }
    } else {
      const argsData = this.getArgsData();
      const tokens = this.getTokens();
      if (!tokens || !tokens.isSudtSudt()) {
        if (argsData.sudtTypeHash === CKB_TYPE_HASH) {
          // sudt => ckb
          amountIn.balance = this._isOrder === false ? this._bridgeInfo.amount : this.getData().toString();
        } else {
          // ckb => sudt
          amountIn.balance =
            this._isOrder === false
              ? this._bridgeInfo.amount
              : (BigInt(this.cell.capacity) - MIN_SUDT_CAPACITY).toString();
        }
      } else {
        amountIn.balance = CellInfoSerializationHolderFactory.getInstance()
          .getSudtCellSerialization()
          .decodeData(this.data)
          .toString();
      }

      if (this.getStatus() !== ORDER_STATUS.COMPLETED) {
        amountOut.balance = argsData.amountOutMin.toString();
      } else {
        if (argsData.sudtTypeHash === CKB_TYPE_HASH) {
          // sudt => ckb
          amountOut.balance = (
            this.getLastOrder()
              .tx.transaction.outputs.filter((x) => this.equalScript(x.lock, this.userLock))
              .reduce((total, cell) => total + BigInt(cell.capacity), BigInt(0)) - BigInt(227_0000_0000)
          ).toString();
        } else {
          // ckb => sudt
          let amount = BigInt(0);
          for (let i = 0; i < this.getLastOrder().tx.transaction.outputs.length; i++) {
            if (this.equalScript(this.getLastOrder().tx.transaction.outputs[i].lock, this.userLock)) {
              const data = this.getLastOrder().tx.transaction.outputsData[i];
              amount += CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().decodeData(data);
            }
          }
          amountOut.balance = amount.toString();
        }
      }
    }

    const steps = this.buildStep();
    const status = this.getStatus();
    const timestamp = this.tx.txStatus.timestamp;
    const type = this.getType();

    const orderHistory: OrderHistory = {
      transactionHash: transactionHash,
      timestamp: timestamp,
      amountIn: amountIn,
      amountOut: amountOut,
      stage: {
        status: status,
        steps: steps,
      },
      type: type,
    };

    return orderHistory;
  }

  tokenA(): Token {
    if (this.getType() === SWAP_ORDER_TYPE.CrossChain) {
      const token = TokenHolderFactory.getInstance().getTokenByShadowFromAddress(this._bridgeInfo.token_addr);

      if (this._isIn) {
        return token.toERC20Token();
      } else {
        return token;
      }
    } else {
      const tokens = this.getTokens();
      if (tokens) {
        return TokenHolderFactory.getInstance().getTokenByTypeHash(tokens.tokenA.typeHash);
      } else {
        const argsData = this.getArgsData();
        const ckbToken = TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH);
        const sudtToken = TokenHolderFactory.getInstance().getTokenByTypeHash(
          argsData.sudtTypeHash === CKB_TOKEN_TYPE_HASH ? this.cell.type.toHash() : argsData.sudtTypeHash,
        );
        return argsData.sudtTypeHash == CKB_TYPE_HASH ? sudtToken : ckbToken;
      }
    }
  }

  tokenB(): Token {
    if (this.getType() === SWAP_ORDER_TYPE.CrossChain) {
      const token = TokenHolderFactory.getInstance().getTokenByShadowFromAddress(this._bridgeInfo.token_addr);

      if (this._isIn) {
        return token;
      } else {
        return token.toERC20Token();
      }
    } else {
      const tokens = this.getTokens();
      if (tokens) {
        return TokenHolderFactory.getInstance().getTokenByTypeHash(tokens.tokenB.typeHash);
      } else {
        const argsData = this.getArgsData();
        const ckbToken = TokenHolderFactory.getInstance().getTokenByTypeHash(CKB_TOKEN_TYPE_HASH);
        const sudtToken = TokenHolderFactory.getInstance().getTokenByTypeHash(
          argsData.sudtTypeHash === CKB_TOKEN_TYPE_HASH ? this.cell.type.toHash() : argsData.sudtTypeHash,
        );

        return argsData.sudtTypeHash == CKB_TYPE_HASH ? ckbToken : sudtToken;
      }
    }
  }

  getArgsData(): SwapOrderCellArgs {
    if (!this._isOrder && this._bridgeInfo) {
      return null;
    }

    const tokens = this.getTokens();
    if (!tokens) {
      return CellInfoSerializationHolderFactory.getInstance()
        .getSwapCellSerialization()
        .decodeArgs(this.cell.lock.args);
    }

    if (tokens.isSudtSudt()) {
      return CellInfoSerializationHolderFactory.getInstance()
        .getSwapCellSudtSudtSerialization()
        .decodeArgs(this.cell.lock.args);
    }

    return CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().decodeArgs(this.cell.lock.args);
  }

  getData(): bigint {
    return CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().decodeData(this.data);
  }

  getType(): string {
    if (this._isOrder && this._bridgeInfo) {
      return SWAP_ORDER_TYPE.CrossChainOrder;
    }

    if (this._bridgeInfo) {
      return SWAP_ORDER_TYPE.CrossChain;
    }

    return SWAP_ORDER_TYPE.Order;
  }

  getStatus(): string {
    if (this.isCancel()) {
      if (this.getLastOrder().tx.txStatus.status === 'pending') {
        return ORDER_STATUS.CANCELING;
      } else {
        return ORDER_STATUS.CANCELED;
      }
    }

    const orders = this.getOrders();
    if (this.getType() === SWAP_ORDER_TYPE.Order) {
      if (orders.length === 1) {
        if (this.tx.txStatus.status === 'pending') {
          return ORDER_STATUS.PENDING;
        }
        return ORDER_STATUS.OPEN;
      }

      if (this.getLastOrder().tx.txStatus.status === 'pending') {
        return ORDER_STATUS.OPEN;
      }

      return ORDER_STATUS.COMPLETED;
    }

    return ORDER_STATUS.COMPLETED;
  }

  buildStep(): Step[] {
    const orders = this.getOrders();
    const result: Step[] = [];

    if (this.tx.txStatus.status === 'pending') {
      if (this.getType() === SWAP_ORDER_TYPE.CrossChain) {
        const ethStep: Step = new Step(this._bridgeInfo.eth_tx_hash);
        const ckbStep: Step = new Step(this._bridgeInfo.ckb_tx_hash);
        if (this._isIn) {
          result.push(ethStep);
        } else {
          result.push(ckbStep);
        }

        return result;
      }

      if (this.getType() === SWAP_ORDER_TYPE.CrossChainOrder) {
        const ethStep: Step = new Step(this._bridgeInfo.eth_tx_hash);
        result.push(ethStep);
        return result;
      }

      if (this.getType() === SWAP_ORDER_TYPE.Order) {
        const step: Step = new Step(this.tx.transaction.hash, this.index.toString());
        result.push(step);
        return result;
      }
    }

    if (this.getType() === SWAP_ORDER_TYPE.CrossChain) {
      const ethStep: Step = new Step(this._bridgeInfo.eth_tx_hash);
      const ckbStep: Step = new Step(this._bridgeInfo.ckb_tx_hash);
      if (this._isIn) {
        result.push(ethStep);
        result.push(ethStep);
        result.push(ckbStep);
      } else {
        result.push(ckbStep);
        result.push(ckbStep);
        result.push(ethStep);
      }

      return result;
    }

    if (this.getType() === SWAP_ORDER_TYPE.CrossChainOrder) {
      const ethStep: Step = new Step(this._bridgeInfo.eth_tx_hash);
      result.push(ethStep);
      result.push(ethStep);
    }

    if (this.getType() === SWAP_ORDER_TYPE.Order) {
      const step: Step = new Step(this.tx.transaction.hash, this.index.toString());
      result.push(step);
    }

    orders.forEach((x) => {
      const step: Step = new Step(x.tx.transaction.hash, x.index.toString());
      result.push(step);
    });

    return result;
  }

  filterOrderHistory(): boolean {
    if (this.getType() === SWAP_ORDER_TYPE.Order || this.getType() === SWAP_ORDER_TYPE.CrossChainOrder) {
      if (
        FORCE_BRIDGE_LOCK_HASH_CODE === this.getLastOrder().tx.transaction.inputs[0].cellOutput.lock.codeHash
        // && this.getLastOrder().tx.txStatus.status === 'pending'
      ) {
        return false;
      } else {
        return true;
      }
    }

    // if (SWAP_ORDER_TYPE.Order === this.getType()) {
    //   return true;
    // }

    if (SWAP_ORDER_TYPE.CrossChainOrder === this.getType()) {
      if (this.getLastOrder().tx.txStatus.status === 'pending') {
        return false;
      }

      return true;
    }

    if (SWAP_ORDER_TYPE.CrossChain === this.getType()) {
      if (this.getStatus() === ORDER_STATUS.COMPLETED) {
        return true;
      }
      return false;
    }

    return false;
  }

  private getTokens(): QuoteBase {
    if (!this.cell.type) {
      return undefined;
    }

    const typeHash = PoolInfoFactory.sortTypeHash(this.cell.lock.args.slice(0, 66), this.cell.type.toHash());
    const key = `0x${utils.blake2b(typeHash).slice(2, 66)}`;
    return PoolInfoFactory.getTokens(key);
  }
}
