import { Script } from '.';
import * as lumos from '@ckb-lumos/base';

export interface ScriptEquals {
  equalsLockScript: (
    script: Script | (lumos.Script | lumos.ScriptWrapper),
    targetScript: Script | (lumos.Script | lumos.ScriptWrapper),
  ) => boolean;
  equalsTypeScript: (
    script: Script | (lumos.Script | lumos.ScriptWrapper | 'empty'),
    targetScript: Script | (lumos.Script | lumos.ScriptWrapper | 'empty'),
  ) => boolean;
}
class DefaultScriptEquals implements ScriptEquals {
  equalsLockScript(
    script: Script | (lumos.Script | lumos.ScriptWrapper),
    targetScript: Script | (lumos.Script | lumos.ScriptWrapper),
  ): boolean {
    return this.equalsScript(script, targetScript);
  }

  equalsTypeScript(
    script: Script | (lumos.Script | lumos.ScriptWrapper | 'empty'),
    targetScript: Script | (lumos.Script | lumos.ScriptWrapper | 'empty'),
  ): boolean {
    if ('empty' === script || 'empty' === targetScript) {
      return false;
    }
    return this.equalsScript(script, targetScript);
  }

  private equalsScript(
    script: Script | (lumos.Script | lumos.ScriptWrapper),
    targetScript: Script | (lumos.Script | lumos.ScriptWrapper),
  ): boolean {
    if (!script || !targetScript) {
      return false;
    }
    const s1 = this.normalizeScript(script);
    const s2 = this.normalizeScript(targetScript);
    return s1.code_hash === s2.code_hash && s1.hash_type === s2.hash_type && s1.args === s2.args;
  }

  normalizeScript(
    script: Script | (lumos.Script | lumos.ScriptWrapper),
  ): {
    code_hash: string;
    hash_type: string;
    args: string;
  } {
    if ('code_hash' in script) {
      const s = script;
      return {
        code_hash: s.code_hash,
        hash_type: s.hash_type,
        args: script.args,
      };
    }

    const s = <Script>script;
    return {
      code_hash: s.codeHash,
      hash_type: s.hashType,
      args: s.args,
    };
  }
}

export const scriptEquals: ScriptEquals = new DefaultScriptEquals();
