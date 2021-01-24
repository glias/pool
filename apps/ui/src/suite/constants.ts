export const CKB_NATIVE_TYPE_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

export const CKB_MIN_CHANGE_CKB = String(61 * 10 ** 8);

export const SWAP_CELL_BID_CAPACITY = 146;

export const SWAP_CELL_ASK_CAPACITY = 227;

export const README_URL = '';

export const EXPLORER_URL = process.env.REACT_APP_EXPLORER_URL! || 'https://explorer.nervos.org/aggron/';

export const ETHER_SCAN_URL = process.env.REACT_APP_ETHER_SCAN_URL! || 'https://ropsten.etherscan.io/';
