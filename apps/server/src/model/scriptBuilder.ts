import dotenv from 'dotenv';
dotenv.config();
import { CellInfoSerializationHolderFactory, LiquidityOrderCellArgs, Script } from '.';

export const LIQUIDITY_ORDER_LOCK_SCRIPT = new Script(
  process.env.LIQUIDITY_REQ_LOCK_CODE_HASH || '0x4c454e1e1d7361d0f0339eba7f8cb88842c547f5a414d0da76c9d5da2ab2ffe2',
  process.env.LIQUIDITY_REQ_LOCK_HASH_TYPE || 'data',
  'user_lock_hash',
);

export class ScriptBuilder {
  static buildLiquidityOrderLockScriptByUserLock(userLockScript: Script): Script {
    return new Script(
      LIQUIDITY_ORDER_LOCK_SCRIPT.codeHash,
      LIQUIDITY_ORDER_LOCK_SCRIPT.hashType,
      userLockScript.toHash(),
    );
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
