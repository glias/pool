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
  @swaggerProperty({ type: 'object', properties: (ScriptSchema as any).swaggerDocument })
  typeScript: ScriptSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @swaggerProperty({ type: 'object', properties: (TokenInfoSchema as any).swaggerDocument })
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

@swaggerClass()
export class OutPointSchema {
  @swaggerProperty({ type: 'string', required: true })
  txHash: string;
  @swaggerProperty({ type: 'string', required: true })
  index: string;
}

@swaggerClass()
export class CellInputSchema {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @swaggerProperty({ type: 'object', properties: (OutPointSchema as any).swaggerDocument, required: true })
  previousOutput: OutPointSchema;
  @swaggerProperty({ type: 'string', required: true })
  since: string;
}

@swaggerClass()
export class CellDepSchema {
  @swaggerProperty({ type: 'string', required: true })
  depType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @swaggerProperty({ type: 'object', properties: (OutPointSchema as any).swaggerDocument, required: true })
  outPoint: OutPointSchema;
}

@swaggerClass()
export class CellSchema {
  @swaggerProperty({ type: 'string', required: true })
  capacity: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @swaggerProperty({ type: 'object', properties: (ScriptSchema as any).swaggerDocument, required: true })
  lock: ScriptSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @swaggerProperty({ type: 'object', properties: (ScriptSchema as any).swaggerDocument })
  type: ScriptSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @swaggerProperty({ type: 'object', properties: (OutPointSchema as any).swaggerDocument })
  outPoint: OutPointSchema;
  @swaggerProperty({ type: 'string' })
  data: string;
}

@swaggerClass()
export class WitnessArgsSchema {
  @swaggerProperty({ type: 'string', required: true })
  inputType: string;
  @swaggerProperty({ type: 'string', required: true })
  lock: string;
  @swaggerProperty({ type: 'string', required: true })
  outputType: string;
}

@swaggerClass()
export class TransactionSchema {
  @swaggerProperty({ type: 'array', items: { type: 'object', properties: (CellSchema as any).swaggerDocument } })
  inputCells: Array<CellSchema>;
  @swaggerProperty({ type: 'array', items: { type: 'object', properties: (CellSchema as any).swaggerDocument } })
  outputs: Array<CellSchema>;
  @swaggerProperty({ type: 'array', items: { type: 'object', properties: (CellDepSchema as any).swaggerDocument } })
  cellDeps: Array<CellDepSchema>;
  @swaggerProperty({ type: 'array', items: { type: 'string' } })
  headerDeps: Array<string>;
  @swaggerProperty({ type: 'string', required: true })
  version: string;
  @swaggerProperty({ type: 'array', items: { type: 'object', properties: (CellInputSchema as any).swaggerDocument } })
  inputs: Array<CellInputSchema>;
  @swaggerProperty({ type: 'string' })
  outputsData: Array<string>;
  @swaggerProperty({
    type: 'array',
    items: { type: 'object', properties: (WitnessArgsSchema as any).swaggerProperty },
  })
  witnessArgs: Array<WitnessArgsSchema>;
  @swaggerProperty({ type: 'array', items: { type: 'string' } })
  witnesses: Array<string>;
}
