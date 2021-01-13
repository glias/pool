import { body, Context, request, responses, summary, tags, description } from 'koa-swagger-decorator';
import { ScriptSchema } from './swagger_schema';

const tokenTag = tags(['Token']);

export default class DexTokenController {
  @request('post', '/v1/tokens')
  @summary('Get Token List')
  @description('Get Token List')
  @tokenTag
  @responses({
    200: {
      description: 'success',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            typeHash: { type: 'number', required: true },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typeScript: { tyep: 'object', properties: (ScriptSchema as any).swaggerDocument },
            name: { type: 'number', required: true },
            symbol: { type: 'number', required: true },
            decimal: { type: 'number', required: true },
            logoUri: { type: 'number', required: true },
            balance: { type: 'number', required: true },
          },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { tyep: 'object', properties: (ScriptSchema as any).swaggerDocument },
    limit: { type: 'number', required: true },
    skip: { type: 'number', required: true },
  })
  public async getTokens(ctx: Context): Promise<void> {
    console.log(ctx);
  }

  @request('post', '/v1/tokens/typeHash')
  @summary('Gets the token by type hash')
  @description('Gets the token by type hash')
  @tokenTag
  @responses({
    200: {
      description: 'success',
      schema: {
        type: 'object',
        properties: {
          typeHash: { type: 'number', required: true },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          typeScript: { tyep: 'object', properties: (ScriptSchema as any).swaggerDocument },
          name: { type: 'number', required: true },
          symbol: { type: 'number', required: true },
          decimal: { type: 'number', required: true },
          logoUri: { type: 'number', required: true },
          balance: { type: 'number', required: true },
        },
      },
    },
  })
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lock: { tyep: 'object', properties: (ScriptSchema as any).swaggerDocument },
    typeHash: { type: 'number', required: true },
  })
  public async getTokenByTypeHash(ctx: Context): Promise<void> {
    console.log(ctx);
  }
}
