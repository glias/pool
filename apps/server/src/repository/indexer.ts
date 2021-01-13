import { Cell, QueryOptions, TransactionWithStatus } from '@ckb-lumos/base';
import { CellCollector, Indexer } from '@ckb-lumos/sql-indexer';
import knex from 'knex';
import { indexer_config, mysql_info } from '../config';
import { TransactionCollector } from './transactio_collector';

class SqlIndexerWrapper {
  private indexer: Indexer;
  private knex: knex;

  init(): void {
    const knex2 = knex({
      client: 'mysql',
      connection: mysql_info,
      // debug: true
    });

    knex2.migrate.up();
    this.knex = knex2;

    this.indexer = new Indexer(indexer_config.nodeUrl, this.knex);
    setTimeout(() => {
      this.indexer.startForever();

      setInterval(async () => {
        const { block_number } = await this.indexer.tip();
        console.log('indexer tip block', parseInt(block_number, 16));
      }, 5000);
    }, 10000);
  }

  async collectCells(queryOptons: QueryOptions): Promise<Array<Cell>> {
    const cellCollector = new CellCollector(this.knex, queryOptons);

    const cells = [];
    for await (const cell of cellCollector.collect()) cells.push(cell);
    return cells;
  }

  async collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>> {
    const transactionCollector = new TransactionCollector(this.knex, queryOptions, this.indexer['rpc']);

    const txs = [];
    for await (const tx of transactionCollector.collect()) {
      txs.push(tx);
    }

    return txs;
  }
}

export const indexer = new SqlIndexerWrapper();
