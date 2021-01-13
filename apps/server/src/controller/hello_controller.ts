import { Server } from '@gliaswap/types';
import { body, Context, request, responses, summary } from 'koa-swagger-decorator';

export default class PoolController {
  @request('post', '/hello')
  @summary('example')
  @responses({ 200: { msg: 'string' } })
  @body({
    test: { type: 'string', required: true, default: '20' },
  })
  public static async hello(ctx: Context): Promise<void> {
    const req = <Server.AddLiquidityRequest>ctx.request.body;
    console.log(req);

    const resp = {
      msg: 'hello pool',
    };

    ctx.status = 200;
    ctx.body = resp;
  }
}
