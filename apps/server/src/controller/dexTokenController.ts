import { body, Context, request, responses, summary, tags, description } from 'koa-swagger-decorator';
import { TokenTokenHolderFactory } from '../model';
import { ScriptSchema, TokenInfoSchema } from './swaggerSchema';

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
            typeHash: { type: 'string', required: true },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typeScript: { tyep: 'object', properties: (ScriptSchema as any).swaggerDocument },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            info: { tyep: 'object', properties: (TokenInfoSchema as any).swaggerDocument },
            balance: { type: 'string', required: true },
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
    console.log(
      TokenTokenHolderFactory.getInstance().getTokenByTypeHash(
        '0xdbfd8e50c62549e24ced774e012b1ea34559ee5e1676fddc63ebd7e3618b3e2c',
      ),
    );

    console.log(TokenTokenHolderFactory.getInstance().getTokens());

    console.log(TokenTokenHolderFactory.getInstance().getTypeScripts());
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
          typeHash: { type: 'string', required: true },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          typeScript: { tyep: 'object', properties: (ScriptSchema as any).swaggerDocument },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          info: { tyep: 'object', properties: (TokenInfoSchema as any).swaggerDocument },
          balance: { type: 'string', required: true },
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
