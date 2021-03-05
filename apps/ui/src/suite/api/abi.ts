export const APPROVE_ABI: any[] = [
  {
    inputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'allowance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'subtractedValue',
        type: 'uint256',
      },
    ],
    name: 'decreaseAllowance',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'addedValue',
        type: 'uint256',
      },
    ],
    name: 'increaseAllowance',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [],
    name: 'getTestToken',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'mint',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export const INFO_ABI: any[] = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [
      {
        name: '',
        type: 'string',
      },
    ],
    payable: false,
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: '',
        type: 'uint8',
      },
    ],
    payable: false,
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: '',
        type: 'string',
      },
    ],
    payable: false,
    type: 'function',
  },
];

export const BRIDGE_SETTINGS = {
  eth_token_locker_addr: '0x4347818B33aaf0b442A977900585B9ad1e1B581F',
  eth_ckb_chain_addr: '0xEab024D7A450F8168855186E7D6c8eC40EB0e99c',
  bridge_lockscript: {
    code_hash: '177a569f067154c4d4a65560c1a0697aff8922f1c74640f70d9cf073e4a6fec0',
    hash_type: 1,
    outpoint: { tx_hash: '36ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a2', index: 0, dep_type: 0 },
  },
  bridge_typescript: {
    code_hash: 'eaf7bdcf8748a9dc57274e1eb94974b009e17a0f69cc2310b65582d7c93c3550',
    hash_type: 1,
    outpoint: { tx_hash: '36ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a2', index: 1, dep_type: 0 },
  },
  light_client_typescript: {
    code_hash: 'b0664a84bd9039cb75e77d03232b62e3bee24de7de4b44c8ccd8993bff44ef6c',
    hash_type: 1,
    outpoint: { tx_hash: '36ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a2', index: 3, dep_type: 0 },
  },
  recipient_typescript: {
    code_hash: 'd532d5f4a46fe8577ad3efc07fbdd12d866e89d4afe75588d76504996d00d600',
    hash_type: 1,
    outpoint: { tx_hash: '36ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a2', index: 2, dep_type: 0 },
  },
  simple_bridge_typescript: {
    code_hash: 'c38af159c9e67286051343b49ecdde8d0ffef9c00029b232a2ec4e17d1e75c7f',
    hash_type: 1,
    outpoint: { tx_hash: '36ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a2', index: 4, dep_type: 0 },
  },
  sudt: {
    code_hash: 'c5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4',
    hash_type: 1,
    outpoint: { tx_hash: 'e12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769', index: 0, dep_type: 0 },
  },
  light_client_cell_script: {
    cell_script:
      '59000000100000003000000031000000b0664a84bd9039cb75e77d03232b62e3bee24de7de4b44c8ccd8993bff44ef6c012400000036ca52255886dc406e99e599c253597f792ca61e7344086c876a968ab6a3d4a205000000',
  },
  multisig_address: { addresses: ['ckt1qyqv608y8u9sjaclqtx4ul6fpzqes4hldjssgk25xj'], require_first_n: 0, threshold: 1 },
  ckb_relay_mutlisig_threshold: { threshold: 1 },
  pw_locks: {
    inner: [
      { tx_hash: '57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38', index: 0, dep_type: 0 },
      { tx_hash: 'f8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37', index: 0, dep_type: 1 },
    ],
  },
};
