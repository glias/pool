import dotenv from 'dotenv';
dotenv.config();
import { LIQUIDITY_LOCK_CODE_HASH, LIQUIDITY_LOCK_HASH_TYPE } from '../config/index';
import * as tokenToken from '../config/tokenToken';
import { CellInfoSerializationHolderFactory, LiquidityOrderCellArgs, Script } from '.';

export const LIQUIDITY_ORDER_LOCK_SCRIPT = new Script(
  LIQUIDITY_LOCK_CODE_HASH,
  LIQUIDITY_LOCK_HASH_TYPE,
  '0x', // 'user_lock_hash'
);

export class ScriptBuilder {
  static buildLiquidityOrderLockScript(): Script {
    return new Script(LIQUIDITY_ORDER_LOCK_SCRIPT.codeHash, LIQUIDITY_ORDER_LOCK_SCRIPT.hashType, '0x');
  }

  static buildSudtSudtLiquidityOrderLockScript(): Script {
    return new Script(tokenToken.LIQUIDITY_LOCK_CODE_HASH, tokenToken.LIQUIDITY_LOCK_HASH_TYPE, '0x');
  }

  static buildLiquidityOrderLockScriptByArgsData(argsData: LiquidityOrderCellArgs): Script {
    return new Script(
      LIQUIDITY_ORDER_LOCK_SCRIPT.codeHash,
      LIQUIDITY_ORDER_LOCK_SCRIPT.hashType,
      CellInfoSerializationHolderFactory.getInstance()
        .getLiquidityCellSerialization()
        .encodeArgs(
          argsData.userLockHash,
          argsData.version,
          argsData.sudtMin,
          argsData.ckbMin,
          argsData.infoTypeHash,
          argsData.tips,
          argsData.tipsSudt,
        ),
    );
  }
}
