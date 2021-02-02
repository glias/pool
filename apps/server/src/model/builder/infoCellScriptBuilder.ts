import { Script } from '..';
import { INFO_TYPE_CODE_HASH, INFO_TYPE_HASH_TYPE } from '../../config';
import * as utils from '../../utils';

export class InfoCellScriptBuilder {
  static buildBySUDTTypeHashAndInfoTypeHash(sudtTypeHash: string, infoTypeHash: string): Script {
    const quoteBaseHash = utils.blake2b(['ckb', sudtTypeHash]);

    return new Script(INFO_TYPE_CODE_HASH, INFO_TYPE_HASH_TYPE, '');
  }
}
