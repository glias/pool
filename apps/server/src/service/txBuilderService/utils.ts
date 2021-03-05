import { Context } from 'koa';
import * as constants from '@gliaswap/constants';

import { Cell, Script, Token, Output } from '../../model';
import { DexRepository } from '../../repository';

export function hexBigint(n: bigint): string {
  return `0x${n.toString(16)}`;
}

export function minCKBChangeCapacity(userLock: Script): bigint {
  return (BigInt(userLock.size()) + 8n) * constants.CKB_DECIMAL; // +8 for capacity bytes
}

export function minTokenChangeCapacity(userLock: Script, tokenType: Script): bigint {
  const scriptSize = BigInt(userLock.size() + tokenType.size());
  return (scriptSize + 8n + constants.MIN_SUDT_DATA_SIZE) * constants.CKB_DECIMAL;
}

export function tips(token: Token): { tips: bigint; tipsSudt: bigint } {
  if (token.typeHash == constants.CKB_TYPE_HASH) {
    return {
      tips: BigInt(token.balance),
      tipsSudt: 0n,
    };
  } else {
    return {
      tips: 0n,
      tipsSudt: BigInt(token.balance),
    };
  }
}

export async function extractRequest(
  ctx: Context,
  dexRepository: DexRepository,
  txHash: string,
  requestLockCodeHash: string,
): Promise<Cell[]> {
  const { transaction } = await dexRepository.getTransaction(txHash);
  const outputCells = transaction.outputs.map((output: Output, idx: number) => {
    if (output.lock.codeHash != requestLockCodeHash) {
      return undefined;
    }

    return {
      cellOutput: output,
      outPoint: {
        txHash: transaction.hash,
        index: `0x${idx.toString(16)}`,
      },
      blockHash: null,
      blockNumber: null,
      data: transaction.outputsData[idx],
    };
  });

  const cells = outputCells.filter((cell: Cell) => cell != undefined);
  if (cells.length == 0) {
    ctx.throw(404, `request not found in transaction ${txHash}`);
  }

  return cells;
}
