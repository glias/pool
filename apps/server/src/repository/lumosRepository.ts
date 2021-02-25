import { Cell, QueryOptions, TransactionWithStatus } from '@ckb-lumos/base';
import { CellCollector, Indexer } from '@ckb-lumos/sql-indexer';
import knex from 'knex';
import { ckbConfig, env, mysqlInfo } from '../config';
import { TransactionCollector } from './transactionCollector';
import { TransactionCollector2 } from './tx/transactionCollector2';

export class SqlIndexerWrapper {
  private indexer: Indexer;
  private knex: knex;

  constructor() {
    this.init();
  }

  init(): void {
    const knex2 = knex({
      client: 'mysql',
      connection: mysqlInfo,
    });

    knex2.migrate.up();
    this.knex = knex2;

    this.indexer = new Indexer(ckbConfig.nodeUrl, this.knex);
    if (env !== 'development') {
      setTimeout(() => {
        this.indexer.startForever();

        setInterval(async () => {
          const { block_number } = await this.indexer.tip();
          console.log('indexer tip block', parseInt(block_number, 16));
        }, 5000);
      }, 10000);
    }
  }

  async collectCells(queryOptons: QueryOptions): Promise<Array<Cell>> {
    const cellCollector = new CellCollector(this.knex, queryOptons);

    const cells = [];
    for await (const cell of cellCollector.collect()) cells.push(cell);
    return cells;
  }

  async collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>> {
    const txs = [];
    const start = new Date().getTime();
    // const transactionCollector = new TransactionCollector(this.knex, queryOptions, this.indexer['rpc']);
    const transactionCollector = new TransactionCollector2(this.knex, queryOptions, this.indexer['rpc']);
    const sqlTime = new Date().getTime();
    for await (const tx of transactionCollector.collect()) {
      txs.push(tx);
    }

    const rpcTime = new Date().getTime();
    console.log('record: ', txs.length);
    console.log('sql time: ', sqlTime - start);
    console.log('rpc time: ', rpcTime - sqlTime);
    console.log('total time: ', rpcTime - start);

    return txs;
  }
}

export const lumosRepository = new SqlIndexerWrapper();
