import { body, Context, request, responses, summary, tags, description } from 'koa-swagger-decorator';
import { ScriptSchema, TokenInfoSchema } from './swagger_schema';

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            info: { tyep: 'object', properties: (TokenInfoSchema as any).swaggerDocument },
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          info: { tyep: 'object', properties: (TokenInfoSchema as any).swaggerDocument },
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
