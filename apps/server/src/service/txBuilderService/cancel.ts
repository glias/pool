import { Context } from 'koa';

import { Cell, Output } from '../../model';
import { DexRepository } from '../../repository';

export async function extractRequest(
  ctx: Context,
  dexRepository: DexRepository,
  txHash: string,
  lockCodeHashes: string[],
): Promise<Cell[]> {
  const { transaction } = await dexRepository.getTransaction(txHash);
  const outputCells = transaction.outputs.map((output: Output, idx: number) => {
    if (!lockCodeHashes.includes(output.lock.codeHash)) {
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
