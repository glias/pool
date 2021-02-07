import dotenv from 'dotenv';
dotenv.config();
import { CellInfoSerializationHolderFactory, LiquidityOrderCellArgs, Script } from '.';
import { LIQUIDITY_LOCK_CODE_HASH, LIQUIDITY_LOCK_HASH_TYPE } from '../config';

export const LIQUIDITY_ORDER_LOCK_SCRIPT = new Script(
  LIQUIDITY_LOCK_CODE_HASH,
  LIQUIDITY_LOCK_HASH_TYPE,
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
