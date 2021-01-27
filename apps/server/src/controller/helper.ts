/* eslint-disable @typescript-eslint/no-explicit-any */
import { AssetSchema, ScriptSchema } from './swaggerSchema';

export const CommonsBody = {
  asset: { type: 'object', properties: (AssetSchema as any).swaggerDocument },
  assets: { type: 'array', items: { type: 'object', properties: (AssetSchema as any).swaggerDocument } },
  script: { type: 'object', properties: (ScriptSchema as any).swaggerDocument },
};
