import { QueryOptions, TransactionWithStatus } from '@ckb-lumos/base';
import { Reader, RPC } from 'ckb-js-toolkit';
import knex from 'knex';
import { dexCache, DexCache } from '../../cache';
import { Script } from '../../model';
import { QueryOptionsWrapper } from './queryOptionsWrapper';

export class TransactionCollector2 {
  private db: knex;
  private queryOptions: QueryOptionsWrapper;
  private rpc: RPC;
  private dexCache: DexCache = dexCache;
  // private cache: Map<string, unknown> = new Map<string, unknown>();
  constructor(db: knex, queryOptions: QueryOptions, rpc: RPC) {
    this.db = db;
    this.queryOptions = new QueryOptionsWrapper(queryOptions);
    this.rpc = rpc;
  }

  async collect(): Promise<Array<TransactionWithStatus>> {
    const hashes = await this.getTxHashes();

    const result = [];

    for (const hash of hashes) {
      let tx;
      const txJson = await this.dexCache.get(hash);
      if (!txJson) {
        tx = await this.rpc.get_transaction(hash);
        if (tx.tx_status.block_hash && tx.tx_status.status !== 'pending') {
          this.dexCache.set(hash, JSON.stringify(tx));
        }
      } else {
        tx = JSON.parse(txJson);
      }
      result.push(tx);
    }

    return result;
  }

  async getBlockTimestampByHash(blockHash: string): Promise<string> {
    const timestamp = await this.dexCache.get(`timestamp:${blockHash}`);
    if (!timestamp) {
      const block = await this.rpc.get_block(blockHash);
      this.dexCache.set(`timestamp:${blockHash}`, block.header.timestamp);
      return block.header.timestamp;
    } else {
      return timestamp;
    }
  }

  // 'select * from `transaction_digests`
  // left join `transactions_scripts` on `transaction_digests`.`id` = `transactions_scripts`.`transaction_digest_id`
  // where (`script_id` in (?)) and (`transaction_digests`.`id` in (?, ?.....))'
  private async getTxHashes(): Promise<string[]> {
    const lockIds = await this.getScriptIds(this.queryOptions.getLockScript(), 'lock');
    // lockIds.forEach((x) => console.log(x));
    let query = this.db('transaction_digests')
      .leftJoin('transactions_scripts', 'transaction_digests.id', 'transactions_scripts.transaction_digest_id')
      .andWhere(function () {
        return this.whereIn('script_id', lockIds);
      });

    if (this.queryOptions.getTypeScript()) {
      const ids = await this.getScriptIds(this.queryOptions.getTypeScript(), 'type');
      // console.log('type id:', ids);
      // 'select distinct `transaction_digests`.`id` from `transaction_digests`
      // left join `transactions_scripts` on `transaction_digests`.`id` = `transactions_scripts`.`transaction_digest_id` where (`script_id` in (?))'
      const subQuery = this.db('transaction_digests')
        .leftJoin('transactions_scripts', 'transaction_digests.id', 'transactions_scripts.transaction_digest_id')
        .andWhere(function () {
          return this.whereIn('script_id', ids);
        })
        .distinct('transaction_digests.id');
      query = query.andWhere(function () {
        return this.whereIn('transaction_digests.id', subQuery);
      });
    }

    query.orderBy([
      { column: 'transaction_digests.block_number', order: this.queryOptions.getOrder() },
      { column: 'transaction_digests.tx_index', order: this.queryOptions.getOrder() },
    ]);

    const items = await query.distinct('transaction_digests.*');
    // console.log(query.toSQL());
    const result: string[] = [];
    for (let i = 0; i < items.length; i++) {
      result.push(this.nodeBufferToHex(items[i].tx_hash));
    }

    return result;
  }

  // 'select * from `scripts` where `code_hash` = ? and substring(args, 1, ?) = ?'
  private async getScriptIds(script: Script, type: string) {
    const begin = new Date().getTime();
    if (!script) {
      return [];
    }

    const argsBuffer = this.hexToNodeBuffer(script.args);
    let query = this.db('scripts');
    query = query.where({
      code_hash: Buffer.from(new Reader(script.codeHash).toArrayBuffer()),
      hash_type: script.hashType === 'data' ? 0 : 1,
    });

    if ('0x' != script.args && this.queryOptions.getLockArgsLen() !== -2) {
      query = query.whereRaw('substring(args, 1, ?) = ?', [argsBuffer.byteLength, argsBuffer]);
    }

    if (script.args !== 'any' && this.queryOptions.getLockArgsLen() === -2 && type === 'lock') {
      // query = query.whereRaw('substring(hex(args), 65, 128) = ?', [script.args.slice(2, 66)]);
      query = query.whereRaw(`hex(args) like '%${script.args.slice(2, 66)}%'`);
    }

    const items = await query.select('id');
    const end = new Date().getTime();
    console.log('script sql: ', end - begin);
    const result = [];
    for (let i = 0; i < items.length; i++) {
      result.push(items[i].id);
    }

    return result;
  }

  private nodeBufferToHex(b) {
    return new Reader(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)).serializeJson();
  }

  private hexToNodeBuffer(b): Buffer {
    return Buffer.from(new Reader(b).toArrayBuffer());
  }
}
