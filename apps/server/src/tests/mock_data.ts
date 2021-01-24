import {
  CKB_STR_TO_HASH,
  INFO_LOCK_CODE_HASH,
  POOL_INFO_TYPE_SCRIPT,
  SWAP_ORDER_LOCK_CODE_HASH,
  SWAP_ORDER_LOCK_HASH_TYPE,
} from '../config';
import { CellInfoSerializationHolderFactory, Script, TokenHolderFactory } from '../model';
import { ScriptBuilder } from '../model';
import { CKB_TYPE_HASH } from '@gliaswap/constants';

const userLockScript = new Script(
  '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
  'type',
  '0x988485609e16d5d5c62be0a4ae12b665fefcb448',
);

export const mockSwapOrder = [
  {
    transaction: {
      cellDeps: [],
      hash: '0xc16b619a7e8370af9d0284c45bce8a82564437170bb1ecc1355b4f0fe0a72c46',
      headerDeps: [],
      inputs: [
        {
          previousOutput: {
            index: '0x0',
            txHash: '0xd299bc36ed9d4b07d973f2ae01a70a396372450942650ab01ce8cd2d0db95d93',
          },
          since: '0x0',
        },
        {
          previousOutput: {
            index: '0x0',
            txHash: '0x9d0a6da0b2ba86255f70475d9bc69dd0b767848ca3f00c63aab101c6c3d0705f',
          },
          since: '0x0',
        },
        {
          previousOutput: {
            index: '0x0',
            txHash: '0x4fb89c233607b501c9a67e9bcdc5113b271c6099cc9b74f28968ec6534990e67',
          },
          since: '0x0',
        },
      ],
      outputs: [
        {
          capacity: '0xb5e88b7798b6',
          lock: {
            args: '0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6',
            codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
            hashType: 'type',
          },
          type: null,
        },
        {
          capacity: '0x9f2115d90',
          lock: {
            args: '0x6c8c7f80161485c3e4adceda4c6c425410140054',
            codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
            hashType: 'type',
          },
          type: null,
        },
        {
          capacity: '0x15bfab7c80',
          lock: {
            args: CellInfoSerializationHolderFactory.getInstance()
              .getSwapCellSerialization()
              .encodeArgs(
                '0x9eb946551d1eed6aad1b186af975af8ddb2d5043a30d28b6228e6b66d4f3521a',
                1,
                1000n,
                CKB_TYPE_HASH,
                0n,
                0n,
              ),
            codeHash: SWAP_ORDER_LOCK_CODE_HASH,
            hashType: SWAP_ORDER_LOCK_HASH_TYPE,
          },
          type: new Script(
            '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            'type',
            '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902',
          ),
        },
      ],
      outputsData: [
        '0x5843aff4a55a90060000000000000000',
        '0x',
        // '0x0040d20853d74600000000000000000001c164f175c714d80000000000000000003930000000000000f600',
        CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().encodeData(0n),
      ],
      version: '0x0',
      witnesses: [],
    },
    txStatus: {
      blockHash: '0x977aa9a6ba5559f6a338c606e6676a99b420663fef4990b7ab25bdb9e01fbc4c',
      status: 'committed',
    },
  },
  {
    transaction: {
      cellDeps: [],
      hash: '0xc16b619a7e8370af9d0284c45bce8a82564437170bb1ecc1355b4f0fe0a72c47',
      headerDeps: [],
      inputs: [
        {
          previousOutput: {
            index: '0x2',
            txHash: '0xc16b619a7e8370af9d0284c45bce8a82564437170bb1ecc1355b4f0fe0a72c46',
          },
          since: '0x0',
        },
      ],
      outputs: [
        {
          capacity: '0x15bfab7c80',
          lock: {
            args: '0x6c8c7f80161485c3e4adceda4c6c425410140054',
            codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
            hashType: SWAP_ORDER_LOCK_HASH_TYPE,
          },
          type: new Script(
            '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            'type',
            '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902',
          ),
        },
      ],
      outputsData: [CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().encodeData(100n)],
      version: '0x0',
      witnesses: [],
    },
    txStatus: {
      blockHash: '0x977aa9a6ba5559f6a338c606e6676a99b420663fef4990b7ab25bdb9e01fbc4e',
      status: 'committed',
    },
  },
];

export const mockLiquidityOrder = [
  {
    transaction: {
      cellDeps: [],
      hash: '0xc16b619a7e8370af9d0284c45bce8a82564437170bb1ecc1355b4f0fe0a72c46',
      headerDeps: [],
      inputs: [
        {
          previousOutput: {
            index: '0x0',
            txHash: '0xd299bc36ed9d4b07d973f2ae01a70a396372450942650ab01ce8cd2d0db95d93',
          },
          since: '0x0',
        },
        {
          previousOutput: {
            index: '0x0',
            txHash: '0x9d0a6da0b2ba86255f70475d9bc69dd0b767848ca3f00c63aab101c6c3d0705f',
          },
          since: '0x0',
        },
        {
          previousOutput: {
            index: '0x0',
            txHash: '0x4fb89c233607b501c9a67e9bcdc5113b271c6099cc9b74f28968ec6534990e67',
          },
          since: '0x0',
        },
      ],
      outputs: [
        {
          capacity: '0xb5e88b7798b6',
          lock: {
            args: '0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6',
            codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
            hashType: 'type',
          },
          type: null,
        },
        {
          capacity: '0x9f2115d90',
          lock: {
            args: '0x6c8c7f80161485c3e4adceda4c6c425410140054',
            codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
            hashType: 'type',
          },
          type: null,
        },
        {
          capacity: '0x15bfab7c80',
          lock: ScriptBuilder.buildLiquidityOrderLockScriptByArgsData({
            userLockHash: userLockScript.toHash(),
            version: 1,
            sudtMin: 1000n,
            ckbMin: 1000n,
            infoTypeHash: new Script(
              '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
              'type',
              '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902',
            ).toHash(),
            tips: 0n,
            tipsSudt: 0n,
          }),
          type: new Script(
            '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            'type',
            '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902',
          ),
        },
      ],
      outputsData: [
        '0x5843aff4a55a90060000000000000000',
        '0x',
        CellInfoSerializationHolderFactory.getInstance().getLiquidityCellSerialization().encodeData(0n),
      ],
      version: '0x0',
      witnesses: [],
    },
    txStatus: {
      blockHash: '0x977aa9a6ba5559f6a338c606e6676a99b420663fef4990b7ab25bdb9e01fbc4c',
      status: 'committed',
    },
  },
  {
    transaction: {
      cellDeps: [],
      hash: '0xc16b619a7e8370af9d0284c45bce8a82564437170bb1ecc1355b4f0fe0a72c47',
      headerDeps: [],
      inputs: [
        {
          previousOutput: {
            index: '0x2',
            txHash: '0xc16b619a7e8370af9d0284c45bce8a82564437170bb1ecc1355b4f0fe0a72c46',
          },
          since: '0x0',
        },
      ],
      outputs: [
        {
          capacity: '0x15bfab7c80',
          lock: {
            args: '0x6c8c7f80161485c3e4adceda4c6c425410140054',
            codeHash: '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63',
            hashType: SWAP_ORDER_LOCK_HASH_TYPE,
          },
          type: new Script(
            '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
            'type',
            '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902',
          ),
        },
      ],
      outputsData: [CellInfoSerializationHolderFactory.getInstance().getSwapCellSerialization().encodeData(100n)],
      version: '0x0',
      witnesses: [],
    },
    txStatus: {
      blockHash: '0x977aa9a6ba5559f6a338c606e6676a99b420663fef4990b7ab25bdb9e01fbc4e',
      status: 'committed',
    },
  },
];

export const mockGliaPoolInfo = [
  {
    cellOutput: {
      capacity: `0x${1000n.toString(16)}`,
      lock: new Script(
        INFO_LOCK_CODE_HASH,
        'type',
        CellInfoSerializationHolderFactory.getInstance()
          .getInfoCellSerialization()
          .encodeArgs(CKB_STR_TO_HASH, TokenHolderFactory.getInstance().getTokenBySymbol('GLIA').typeHash),
      ),
      type: POOL_INFO_TYPE_SCRIPT[0],
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
  },
];

export const mockCkEthPoolInfo = [
  {
    cellOutput: {
      capacity: `0x${1000n.toString(16)}`,
      lock: new Script(
        INFO_LOCK_CODE_HASH,
        'type',
        CellInfoSerializationHolderFactory.getInstance()
          .getInfoCellSerialization()
          .encodeArgs(CKB_STR_TO_HASH, TokenHolderFactory.getInstance().getTokenBySymbol('ckETH').typeHash),
      ),

      type: POOL_INFO_TYPE_SCRIPT[1],
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
  },
];
const infoTypeScript = new Script(
  INFO_LOCK_CODE_HASH,
  'type',
  CellInfoSerializationHolderFactory.getInstance()
    .getInfoCellSerialization()
    .encodeArgs(CKB_STR_TO_HASH, TokenHolderFactory.getInstance().getTokenBySymbol('ckETH').typeHash),
);
export const mockUserLiquidityCells = [
  {
    cellOutput: {
      capacity: `0x${1000n.toString(16)}`,
      lock: userLockScript,
      type: new Script(
        TokenHolderFactory.getInstance().getTokenBySymbol('ckETH').typeHash,
        'type',
        infoTypeScript.toHash(),
      ).toLumosScript(),
    },
    outPoint: {
      txHash: 'txHash',
      index: '0x0',
    },
    blockHash: 'blockHash',
    blockNumber: `0x${1001n.toString(16)}`,
    data: CellInfoSerializationHolderFactory.getInstance().getPoolCellSerialization().encodeData(1000n),
  },
  {
    cellOutput: {
      capacity: `0x${1000n.toString(16)}`,
      lock: userLockScript,
      type: new Script(
        TokenHolderFactory.getInstance().getTokenBySymbol('ckETH').typeHash,
        'type',
        infoTypeScript.toHash(),
      ).toLumosScript(),
    },
    outPoint: {
      txHash: 'txHash',
      index: '0x1',
    },
    blockHash: 'blockHash',
    blockNumber: `0x${1001n.toString(16)}`,
    data: CellInfoSerializationHolderFactory.getInstance().getPoolCellSerialization().encodeData(1000n),
  },
];
