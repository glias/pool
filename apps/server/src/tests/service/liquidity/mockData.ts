import { INFO_LOCK_CODE_HASH, INFO_LOCK_HASH_TYPE } from '../../../config';
import { CellInfoSerializationHolderFactory, PoolInfo, Script, TokenHolderFactory } from '../../../model';

export const mockGliaPoolInfo = {
  cellOutput: {
    capacity: `0x${1000n.toString(16)}`,
    lock: new Script(
      INFO_LOCK_CODE_HASH,
      INFO_LOCK_HASH_TYPE,
      CellInfoSerializationHolderFactory.getInstance()
        .getInfoCellSerialization()
        .encodeArgs(
          TokenHolderFactory.getInstance().getTokenBySymbol('GLIA').typeHash,
          PoolInfo.TYPE_SCRIPTS['GLIA'].toHash(),
        ),
    ),
    type: PoolInfo.TYPE_SCRIPTS['GLIA'],
  },
  outPoint: {
    txHash: 'txHash',
    index: '0x0',
  },
  blockHash: 'blockHash',
  blockNumber: `0x${1001n.toString(16)}`,
  data: CellInfoSerializationHolderFactory.getInstance()
    .getInfoCellSerialization()
    .encodeData(1500n, 1500n, 1500n, '0x0000000000000000000000000000000000000000000000000000000000000011'),
};

export const mockCkEthPoolInfo = {
  cellOutput: {
    capacity: `0x${1000n.toString(16)}`,
    lock: new Script(
      INFO_LOCK_CODE_HASH,
      INFO_LOCK_HASH_TYPE,
      CellInfoSerializationHolderFactory.getInstance()
        .getInfoCellSerialization()
        .encodeArgs(
          TokenHolderFactory.getInstance().getTokenBySymbol('ckETH').typeHash,
          PoolInfo.TYPE_SCRIPTS['ckETH'].toHash(),
        ),
    ),

    type: PoolInfo.TYPE_SCRIPTS['ckETH'],
  },
  outPoint: {
    txHash: 'txHash',
    index: '0x0',
  },
  blockHash: 'blockHash',
  blockNumber: `0x${1001n.toString(16)}`,
  data: CellInfoSerializationHolderFactory.getInstance()
    .getInfoCellSerialization()
    .encodeData(2000n, 2000n, 2000n, '0x0000000000000000000000000000000000000000000000000000000000000012'),
};
