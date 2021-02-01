// import axios from 'axios';
// import { CKB_TYPE_HASH, CKB_DECIMAL } from '@gliaswap/constants';
// import * as commons from '@gliaswap/commons';
// import dotenv from 'dotenv';
// dotenv.config();
// import { TokenHolderFactory } from '../src/model';
// import * as config from '../src/config';
// import CKBComponents from '@nervosnetwork/ckb-sdk-core/lib';
// import CKB from '@nervosnetwork/ckb-sdk-core';
// import { AddressPrefix } from '@nervosnetwork/ckb-sdk-utils';
//
// const USER_PRIV_KEY = process.env.USER_PRIV_KEY;
// const USER_LOCK: CKBComponents.Script = {
//   codeHash: config.SECP256K1_LOCK_CODE_HASH,
//   hashType: 'type',
//   args: process.env.USER_LOCK_ARGS,
// };
// // const TOKENS = ['GLIA', 'ckETH', 'ckDAI', 'ckUSDC', 'ckUSDT'];
// const TOKEN_HOLDER = TokenHolderFactory.getInstance();
// const LP_TOKEN_TYPE_HASH = {
//   GLIA: '0x0addc3b7a6e0f3cb4416f3f80fabfe8d6499e0efb6ef7cc51f2b8852dbd6387c',
// };
//
// const ckbToken = (amount: bigint) => {
//   const token = TOKEN_HOLDER.getTokenBySymbol('CKB');
//
//   return {
//     balance: amount.toString(),
//     typeHash: CKB_TYPE_HASH,
//     ...token.info,
//   };
// };
//
// const generateToken = (amount: bigint, symbol: string) => {
//   const token = TOKEN_HOLDER.getTokenBySymbol(symbol);
//
//   return {
//     balance: amount.toString(),
//     typeHash: token.typeHash,
//     ...token.info,
//   };
// };
//
// // FIXME: LP token info
// const generateLPToken = (amount: bigint, symbol: string) => {
//   const token = TOKEN_HOLDER.getTokenBySymbol(symbol);
//
//   return {
//     balance: amount.toString(),
//     typeHash: LP_TOKEN_TYPE_HASH[symbol],
//     ...token.info,
//   };
// };
//
// const deserializeTransactionToSign = (serialized: commons.SerializedTransactonToSign) => {
//   const inputs = serialized.inputCells.map((cell) => {
//     return {
//       previousOutput: {
//         txHash: cell.txHash,
//         index: cell.index,
//       },
//       since: '0x0',
//     };
//   });
//   const outputs = serialized.outputCells.map((cell) => {
//     return {
//       capacity: cell.capacity,
//       lock: cell.lock,
//       type: cell.type,
//     };
//   });
//   const outputsData = serialized.outputCells.map((cell) => {
//     return cell.data;
//   });
//
//   const txToSign: CKBComponents.RawTransactionToSign = {
//     version: serialized.version,
//     cellDeps: serialized.cellDeps,
//     headerDeps: serialized.headerDeps,
//     inputs,
//     outputs,
//     witnesses: serialized.witnessArgs,
//     outputsData,
//   };
//
//   return txToSign;
// };
//
// async function createTestPool(tokenSymbol: string) {
//   if (!config.POOL_ID[tokenSymbol]) {
//     throw new Error(`unknown token symbol: ${tokenSymbol}`);
//   }
//   console.log(`create ${tokenSymbol} pool, id: ${config.POOL_ID[tokenSymbol]}`);
//
//   const req = {
//     assets: [ckbToken(0n), generateToken(0n, tokenSymbol)],
//     lock: USER_LOCK,
//   };
//
//   // console.log(req);
//
//   try {
//     const resp = await axios.post('http://127.0.0.1:3000/v1/liquidity-pool/create', req);
//     const tx = deserializeTransactionToSign(resp.data.tx);
//     // console.log(JSON.stringify(tx, null, 2));
//     console.log(resp.data.fee);
//     console.log(resp.data.lpToken);
//
//     // console.log(tx.witnesses);
//     const signedTx = ckb.signTransaction(USER_PRIV_KEY)(tx);
//     // console.log(JSON.stringify(signedTx, null, 2));
//
//     const sendTxReq = {
//       signedTx: signedTx,
//     };
//     const sendResp = await axios.post('http://127.0.0.1:3000/v1/transaction/send', sendTxReq);
//     console.log(sendResp.data.txHash);
//   } catch (e) {
//     if (axios.isAxiosError(e)) {
//       if (e.response) {
//         console.log(e.response.status);
//         console.log(e.response.statusText);
//         console.log(e.response.data);
//       } else {
//         console.log(e.message);
//       }
//     } else {
//       console.log(e);
//     }
//   }
// }
//
// async function createGenesisTx(tokenSymbol: string) {
//   if (!config.POOL_ID[tokenSymbol]) {
//     throw new Error(`unknown token symbol: ${tokenSymbol}`);
//   }
//   console.log(`create ${tokenSymbol} genesis, id: ${config.POOL_ID[tokenSymbol]}`);
//
//   const req = {
//     assets: [ckbToken(10n * CKB_DECIMAL), generateToken(10n * CKB_DECIMAL, tokenSymbol)],
//     poolId: config.POOL_ID[tokenSymbol],
//     lock: USER_LOCK,
//     tips: ckbToken(0n),
//   };
//
//   // console.log(req);
//
//   try {
//     const resp = await axios.post('http://127.0.0.1:3000/v1/liquidity-pool/orders/genesis-liquidity', req);
//     const tx = deserializeTransactionToSign(resp.data.tx);
//     // console.log(JSON.stringify(tx, null, 2));
//     // console.log(resp.data.fee);
//
//     const signedTx = ckb.signTransaction(USER_PRIV_KEY)(tx);
//     // console.log(JSON.stringify(signedTx, null, 2));
//
//     const sendTxReq = {
//       signedTx: signedTx,
//     };
//     const sendResp = await axios.post('http://127.0.0.1:3000/v1/transaction/send', sendTxReq);
//     console.log(sendResp.data.txHash);
//   } catch (e) {
//     if (axios.isAxiosError(e)) {
//       if (e.response) {
//         console.log(e.response.status);
//         console.log(e.response.statusText);
//         console.log(e.response.data);
//       } else {
//         console.log(e.message);
//       }
//     } else {
//       console.log(e);
//     }
//   }
// }
//
// async function createAddLiquidityTx(tokenSymbol: string) {
//   if (!config.POOL_ID[tokenSymbol]) {
//     throw new Error(`unknown token symbol: ${tokenSymbol}`);
//   }
//   console.log(`create ${tokenSymbol} add liquidity, id: ${config.POOL_ID[tokenSymbol]}`);
//
//   const req = {
//     assetsWithDesiredAmount: [ckbToken(1000n * CKB_DECIMAL), generateToken(300n * CKB_DECIMAL, tokenSymbol)],
//     assetsWithMinAmount: [ckbToken(100n * CKB_DECIMAL), generateToken(100n * CKB_DECIMAL, tokenSymbol)],
//     poolId: config.POOL_ID[tokenSymbol],
//     lock: USER_LOCK,
//     tips: ckbToken(0n),
//   };
//
//   // console.log(req);
//
//   try {
//     const resp = await axios.post('http://127.0.0.1:3000/v1/liquidity-pool/orders/add-liquidity', req);
//     const tx = deserializeTransactionToSign(resp.data.tx);
//     // console.log(JSON.stringify(tx, null, 2));
//     // console.log(resp.data.fee);
//
//     const signedTx = ckb.signTransaction(USER_PRIV_KEY)(tx);
//     // console.log(JSON.stringify(signedTx, null, 2));
//
//     const sendTxReq = {
//       signedTx: signedTx,
//     };
//     const sendResp = await axios.post('http://127.0.0.1:3000/v1/transaction/send', sendTxReq);
//     console.log(sendResp.data.txHash);
//   } catch (e) {
//     if (axios.isAxiosError(e)) {
//       if (e.response) {
//         console.log(e.response.status);
//         console.log(e.response.statusText);
//         console.log(e.response.data);
//       } else {
//         console.log(e.message);
//       }
//     } else {
//       console.log(e);
//     }
//   }
// }
//
// async function createRemoveLiquidityTx(tokenSymbol: string) {
//   if (!config.POOL_ID[tokenSymbol]) {
//     throw new Error(`unknown token symbol: ${tokenSymbol}`);
//   }
//   console.log(`create ${tokenSymbol} remove liquidity, id: ${config.POOL_ID[tokenSymbol]}`);
//
//   const req = {
//     assetsWithMinAmount: [ckbToken(10n * CKB_DECIMAL), generateToken(10n * CKB_DECIMAL, tokenSymbol)],
//     lpToken: generateLPToken(50n * CKB_DECIMAL, tokenSymbol),
//     poolId: config.POOL_ID[tokenSymbol],
//     lock: USER_LOCK,
//     tips: ckbToken(0n),
//   };
//
//   // console.log(req);
//
//   try {
//     const resp = await axios.post('http://127.0.0.1:3000/v1/liquidity-pool/orders/remove-liquidity', req);
//     const tx = deserializeTransactionToSign(resp.data.tx);
//     // console.log(JSON.stringify(tx, null, 2));
//     // console.log(resp.data.fee);
//
//     const signedTx = ckb.signTransaction(USER_PRIV_KEY)(tx);
//     // console.log(JSON.stringify(signedTx, null, 2));
//
//     const sendTxReq = {
//       signedTx: signedTx,
//     };
//     const sendResp = await axios.post('http://127.0.0.1:3000/v1/transaction/send', sendTxReq);
//     console.log(sendResp.data.txHash);
//   } catch (e) {
//     if (axios.isAxiosError(e)) {
//       if (e.response) {
//         console.log(e.response.status);
//         console.log(e.response.statusText);
//         console.log(e.response.data);
//       } else {
//         console.log(e.message);
//       }
//     } else {
//       console.log(e);
//     }
//   }
// }
//
// async function createCancelLiquidityTx(txHash: string) {
//   console.log(`create cancel liquidity, txHash: ${txHash}`);
//
//   const req = {
//     txHash,
//     lock: USER_LOCK,
//   };
//
//   // console.log(req);
//
//   try {
//     const resp = await axios.post('http://127.0.0.1:3000/v1/liquidity-pool/orders/cancel', req);
//     const tx = deserializeTransactionToSign(resp.data.tx);
//     // console.log(JSON.stringify(tx, null, 2));
//     // console.log(resp.data.fee);
//   } catch (e) {
//     if (axios.isAxiosError(e)) {
//       if (e.response) {
//         console.log(e.response.status);
//         console.log(e.response.statusText);
//         console.log(e.response.data);
//       } else {
//         console.log(e.message);
//       }
//     } else {
//       console.log(e);
//     }
//   }
// }
//
// async function createSwapTx(tokenSymbol: string) {
//   if (!config.POOL_ID[tokenSymbol]) {
//     throw new Error(`unknown token symbol: ${tokenSymbol}`);
//   }
//   console.log(`create ${tokenSymbol} swap, id: ${config.POOL_ID[tokenSymbol]}`);
//
//   // const req = {
//   //   assetInWithAmount: ckbToken(100n * CKB_DECIMAL),
//   //   assetOutWithMinAmount: generateToken(5n * CKB_DECIMAL, tokenSymbol),
//   //   lock: USER_LOCK,
//   //   tips: ckbToken(0n),
//   // };
//   const req = {
//     assetInWithAmount: generateToken(10n * CKB_DECIMAL, tokenSymbol),
//     assetOutWithMinAmount: ckbToken(2n * CKB_DECIMAL),
//     lock: USER_LOCK,
//     tips: ckbToken(0n),
//   };
//
//   // console.log(req);
//
//   try {
//     const resp = await axios.post('http://127.0.0.1:3000/v1/swap/orders/swap', req);
//     const tx = deserializeTransactionToSign(resp.data.tx);
//     // console.log(JSON.stringify(tx, null, 2));
//     // console.log(resp.data.fee);
//
//     const signedTx = ckb.signTransaction(USER_PRIV_KEY)(tx);
//     // console.log(JSON.stringify(signedTx, null, 2));
//
//     const sendTxReq = {
//       signedTx: signedTx,
//     };
//     const sendResp = await axios.post('http://127.0.0.1:3000/v1/transaction/send', sendTxReq);
//     console.log(sendResp.data.txHash);
//   } catch (e) {
//     if (axios.isAxiosError(e)) {
//       if (e.response) {
//         console.log(e.response.status);
//         console.log(e.response.statusText);
//         console.log(e.response.data);
//       } else {
//         console.log(e.message);
//       }
//     } else {
//       console.log(e);
//     }
//   }
// }
//
// const ckb = new CKB(config.ckbConfig.nodeUrl);
// const address = ckb.utils.privateKeyToAddress(USER_PRIV_KEY, { prefix: AddressPrefix.Testnet });
// console.log(`use address: ${address}`);
//
// // createTestPool('GLIA');
// // createGenesisTx('GLIA');
// // createAddLiquidityTx('GLIA');
// // createRemoveLiquidityTx('GLIA');
// // createCancelLiquidityTx('0x7dc1554334dbde8393be45126a856654a93ea5c8a437ba32c99e9dcd783f22e2');
// // createSwapTx('GLIA');
