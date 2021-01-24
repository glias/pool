import dotenv from 'dotenv';
dotenv.config();
import { CellInfoSerializationHolderFactory, LiquidityOrderCellArgs, Script } from '.';

export const LIQUIDITY_ORDER_LOCK_SCRIPT = new Script(
  process.env.LIQUIDITY_REQ_LOCK_CODE_HASH || '0x0000000000000000000000000000000000000000000000000000000000000001',
  process.env.LIQUIDITY_REQ_LOCK_HASH_TYPE || 'type',
  'user_lock_hash',
);

export class ScriptBuilder {
  static buildLiquidityOrderLockScriptByUserLock(userLockScript: Script): Script {
    return new Script(
      LIQUIDITY_ORDER_LOCK_SCRIPT.codeHash,
      LIQUIDITY_ORDER_LOCK_SCRIPT.codeHash,
      userLockScript.toHash(),
    );
  }

  static buildLiquidityOrderLockScriptByArgsData(argsData: LiquidityOrderCellArgs): Script {
    return new Script(
      LIQUIDITY_ORDER_LOCK_SCRIPT.codeHash,
      LIQUIDITY_ORDER_LOCK_SCRIPT.codeHash,
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
