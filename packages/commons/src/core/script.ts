import * as pw from '@lay2/pw-core';
import * as lumos from '@ckb-lumos/base';

export enum HashType {
  data = 'data',
  type = 'type',
}

export interface JsonScript {
  codeHash: string;
  hashType: string;
  args: string;
}

export class Script {
  codeHash: string;
  hashType: string;
  args: string;

  constructor(codeHash: string, hashType: HashType, args: string) {
    this.codeHash = codeHash;
    this.hashType = hashType == HashType.data ? HashType.data : HashType.type;
    this.args = args;
  }

  static fromJson(jsonScript: JsonScript): Script {
    const hashType = jsonScript.hashType == 'type' ? HashType.type : HashType.data;
    return new Script(jsonScript.codeHash, hashType, jsonScript.args);
  }

  static fromLumos(lumosScript: lumos.Script): Script {
    const hashType = lumosScript.hash_type == 'type' ? HashType.type : HashType.data;
    return new Script(lumosScript.code_hash, hashType, lumosScript.args);
  }

  static fromPw(pwScript: pw.Script): Script {
    return new Script(pwScript.codeHash, pwScript.hashType == 'type' ? HashType.type : HashType.data, pwScript.args);
  }

  toPw(): pw.Script {
    return new pw.Script(this.codeHash, this.args, this.hashType == 'type' ? pw.HashType.type : pw.HashType.data);
  }

  toJson(): JsonScript {
    return {
      ...this,
    };
  }
}
