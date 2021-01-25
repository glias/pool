import { body, Context, request, responses, summary, description } from 'koa-swagger-decorator';

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
    const signedTx = <CKBComponents.RawTransaction>ctx.request.body;
    const txHash = await this.service.sendTransaction(signedTx);

    ctx.status = 200;
    ctx.body = { txHash };
  }
}
