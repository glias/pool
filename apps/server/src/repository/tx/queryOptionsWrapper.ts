import { QueryOptions } from '@ckb-lumos/base';
import * as lumos from '@ckb-lumos/base';
import { Script } from '../../model';

export class QueryOptionsWrapper {
  constructor(private queryOptions: QueryOptions) {}
  getLockScript(): Script {
    return this.converScript(this.queryOptions.lock);
  }

  getTypeScript(): Script {
    return this.converScript(this.queryOptions.type);
  }

  getOrder(): string {
    if (this.queryOptions.order) {
      return this.queryOptions.order;
    }

    return 'asc';
  }

  getArgsLen(): string | number {
    return this.queryOptions.argsLen;
  }

  private converScript(script: lumos.Script | lumos.ScriptWrapper | 'empty'): Script {
    if (!script) {
      return null;
    }

    if (script === 'empty') {
      return null;
    }

    if ('argsLen' in script) {
      const s = <lumos.ScriptWrapper>script;
      return new Script(s.script.code_hash, s.script.hash_type, s.script.args);
    }
    if ('code_hash' in script) {
      const s = <lumos.Script>script;
      return new Script(s.code_hash, s.hash_type, s.args);
    }
  }
}
