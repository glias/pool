// import knex from 'knex';
// import { RPC as ToolKitRpc } from 'ckb-js-toolkit';
// import { mysqlInfo } from '../../config';
// import { TransactionCollector2 } from '../../repository/tx/transactionCollector2';
//
// describe('tx collector', () => {
//   let db;
//   const lockCodeHash = '0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63';
//   const lockArgs = '0x6c8c7f80161485c3e4adceda4c6c425410140054';
//   const typeCodeHash = '0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4';
//   const typeArgs = '0x6fe3733cd9df22d05b8a70f7b505d0fb67fb58fb88693217135ff5079713e902';
//   const toolkitRPC = new ToolKitRpc('http://localhost:8116');
//   beforeEach(() => {
//     db = knex({
//       client: 'mysql',
//       connection: mysqlInfo,
//     });
//   });
//
//   afterEach(function () {
//     db.destroy();
//   });
//
//   it('tx collector', async () => {
//     const collect: TransactionCollector2 = new TransactionCollector2(
//       db,
//       {
//         lock: {
//           code_hash: lockCodeHash,
//           hash_type: 'type',
//           args: lockArgs,
//         },
//         type: {
//           code_hash: typeCodeHash,
//           hash_type: 'data',
//           args: typeArgs,
//         },
//       },
//       toolkitRPC,
//     );
//
//     const start = new Date().getTime();
//     const txs = await collect.collect();
//
//     const sqlTime = new Date().getTime();
//
//     const result = [];
//     for await (const tx of txs) {
//       result.push(tx);
//     }
//
//     const rpcTime = new Date().getTime();
//     console.log('record: ', result.length);
//     console.log('sql time: ', sqlTime - start);
//     console.log('rpc time: ', rpcTime - sqlTime);
//     console.log('total time: ', rpcTime - start);
//   });
// });
