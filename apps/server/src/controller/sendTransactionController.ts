import { body, Context, request, responses, summary, description } from 'koa-swagger-decorator';
import * as ckbToolkit from 'ckb-js-toolkit';

import { sendTransactionService, SendTransactionService } from '../service';
import { SignedTransactionSchema } from './swaggerSchema';

export default class SendTransactionController {
  private readonly service: SendTransactionService;

  constructor() {
    this.service = sendTransactionService;
  }

  @request('post', '/v1/transaction/send')
  @summary('Send transaction')
  @description('Send transaction')
  @responses({
    200: {
      description: 'success',
      schema: {
        type: 'object',
        properties: {
          txHash: { type: 'string', required: true },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signedTx: { type: 'object', properties: (SignedTransactionSchema as any).swaggerDocument },
  })
  public async getSwapOrders(ctx: Context): Promise<void> {
    const reqBody = <{ signedTx: CKBComponents.RawTransaction }>ctx.request.body;

    try {
      const cellDeps = reqBody.signedTx.cellDeps.map((cellDep) => {
        return {
          depType: cellDep.depType == 'code' ? 'code' : 'dep_group',
          outPoint: cellDep.outPoint,
        };
      });
      ckbToolkit.transformers.TransformTransaction({
        ...reqBody.signedTx,
        cellDeps,
      });
    } catch (e) {
      ctx.throw(400, e);
    }

    try {
      const txHash = await this.service.sendTransaction(reqBody.signedTx);

      ctx.status = 200;
      ctx.body = { txHash };
    } catch (e) {
      ctx.throw(400, e.toString());
    }
  }
}
