import dotenv from 'dotenv';
dotenv.config();
import { CellInfoSerializationHolderFactory, LiquidityOrderCellArgs, Script } from '.';

export const LIQUIDITY_ORDER_LOCK_SCRIPT = new Script(
  process.env.LIQUIDITY_REQ_LOCK_CODE_HASH || '0x062f28d5303cf27273f89f88b03a4a591e70b1bf4983dd9c63dab9fad58aa9bb',
  process.env.LIQUIDITY_REQ_LOCK_HASH_TYPE || 'data',
  '0x', // 'user_lock_hash'
);

export class ScriptBuilder {
  static buildLiquidityOrderLockScript(): Script {
    return new Script(LIQUIDITY_ORDER_LOCK_SCRIPT.codeHash, LIQUIDITY_ORDER_LOCK_SCRIPT.hashType, '0x');
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
