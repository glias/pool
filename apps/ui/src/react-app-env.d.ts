/// <reference types="react-scripts" />
/// <reference types="@nervosnetwork/ckb-types" />
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';

    REACT_APP_ETH_NETWORK: string;
    REACT_APP_INFURA_ID: string;
    REACT_APP_CKB_NODE_URL: string;
    REACT_APP_CKB_CHAIN_ID: string;
    REACT_APP_CKB_EXPLORER_URL: string;
  }
}
