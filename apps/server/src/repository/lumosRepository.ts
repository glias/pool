import { Cell, QueryOptions, TransactionWithStatus } from '@ckb-lumos/base';
import { CellCollector, Indexer } from '@ckb-lumos/sql-indexer';
import knex from 'knex';
import { dexCache, DexCache } from '../cache';
import { ckbConfig, env, mysqlInfo } from '../config';
import { TransactionCollector2 } from './tx/transactionCollector2';

export class SqlIndexerWrapper {
  private indexer: Indexer;
  private knex: knex;
  private dexCache: DexCache = dexCache;

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
      if (dexCache.getLock('syncNode', 3000)) {
        return;
      }
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
    const transactionCollector = new TransactionCollector2(this.knex, queryOptions, this.indexer['rpc']);
    return transactionCollector.collect();
  }
}

export const lumosRepository = new SqlIndexerWrapper();
