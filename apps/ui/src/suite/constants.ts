export const CKB_NATIVE_TYPE_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

export const CKB_MIN_CHANGE_CKB = String(61 * 10 ** 8);

export const SWAP_CELL_BID_CAPACITY = 142;

export const SWAP_CELL_ASK_CAPACITY = 227;

export const CROSS_CHAIN_FEE = 0.001;

export const SWAP_FEE = 0.003;

export const MAX_TRANSACTION_FEE = 0.01;

export const README_URL = '';

export const EXPLORER_URL = process.env.REACT_APP_EXPLORER_URL! || 'https://explorer.nervos.org/aggron/';

export const ETHER_SCAN_URL = process.env.REACT_APP_ETHER_SCAN_URL! || 'https://ropsten.etherscan.io/';

export const FORCE_BRIDGER_SERVER_URL = process.env.REACT_APP_FORCE_BRIDGER_SERVER_URL! || 'http://47.56.233.149:3003';

export const CKB_NODE_URL = process.env.REACT_APP_CKB_NODE_URL! || 'http://121.196.29.165:8114/rpc';
