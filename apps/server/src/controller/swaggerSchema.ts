import { swaggerClass, swaggerProperty } from 'koa-swagger-decorator';
import { Script } from '@ckb-lumos/base';

@swaggerClass()
export class ScriptSchema {
  @swaggerProperty({ type: 'string', required: true })
  codeHash: string;
  @swaggerProperty({ type: 'string', required: true })
  hashType: string;
  @swaggerProperty({ type: 'string', required: true })
  args: string;
}

@swaggerClass()
export class TokenInfoSchema {
  @swaggerProperty({ type: 'string', required: true })
  name: string;
  @swaggerProperty({ type: 'string', required: true })
  symbol: string;
  @swaggerProperty({ type: 'number', required: true })
  decimal: number;
  @swaggerProperty({ type: 'string', required: true })
  logoUri: string;
}

@swaggerClass()
export class TokenSchema {
  @swaggerProperty({ type: 'string', required: true })
  typeHash: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @swaggerProperty({ type: 'object', properties: (ScriptSchema as any).swaggerDocument, required: true })
  typeScript: Script;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @swaggerProperty({ type: 'object', properties: (TokenInfoSchema as any).swaggerDocument, required: true })
  info: TokenInfoSchema;
  @swaggerProperty({ type: 'string', required: true })
  balance: string;
}

@swaggerClass()
export class StepSchema {
  @swaggerProperty({ type: 'string', required: true })
  transactionHash: string;
  @swaggerProperty({ type: 'string', required: true })
  index: string;
  @swaggerProperty({ type: 'string', required: true })
  errorMessage: string;
}
