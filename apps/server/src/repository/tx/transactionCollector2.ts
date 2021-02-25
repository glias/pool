import { QueryOptions } from '@ckb-lumos/base';
import { Reader, RPC } from 'ckb-js-toolkit';
import knex from 'knex';
import { QueryOptionsWrapper } from './queryOptionsWrapper';
import { Script } from '../../model';
import { dexCache, DexCache } from '../../cache';

export class TransactionCollector2 {
  private db: knex;
  private queryOptions: QueryOptionsWrapper;
  private rpc: RPC;
  private dexCache: DexCache = dexCache;
  constructor(db: knex, queryOptions: QueryOptions, rpc: RPC) {
    this.db = db;
    this.queryOptions = new QueryOptionsWrapper(queryOptions);
    this.rpc = rpc;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async *collect(): AsyncGenerator<any, void, unknown> {
    const hashes = await this.getTxHashes();

    for (const hash of hashes) {
      let tx;
      const txJson = await this.dexCache.get(hash);
      if (!txJson) {
        tx = await this.rpc.get_transaction(hash);
        this.dexCache.set(hash, JSON.stringify(tx));
      }
      tx = JSON.parse(txJson);

      yield tx;
    }
  }

  // 'select * from `transaction_digests`
  // left join `transactions_scripts` on `transaction_digests`.`id` = `transactions_scripts`.`transaction_digest_id`
  // where (`script_id` in (?)) and (`transaction_digests`.`id` in (?, ?.....))'
  private async getTxHashes(): Promise<string[]> {
    const lockIds = await this.getScriptIds(this.queryOptions.getLockScript());
    const ids = await this.getTxIdsByTypeScriptIds(this.queryOptions.getTypeScript());

    let query = this.db('transaction_digests')
      .leftJoin('transactions_scripts', 'transaction_digests.id', 'transactions_scripts.transaction_digest_id')
      .andWhere(function () {
        return this.whereIn('script_id', lockIds);
      });
    if (ids.length !== 0) {
      query = query.andWhere(function () {
        return this.whereIn('transaction_digests.id', ids);
      });
    }

    query.orderBy([
      { column: 'transaction_digests.block_number', order: this.queryOptions.getOrder() },
      { column: 'transaction_digests.tx_index', order: this.queryOptions.getOrder() },
    ]);

    const items = await query.distinct('transaction_digests.*');
    const result: string[] = [];
    for (let i = 0; i < items.length; i++) {
      result.push(this.nodeBufferToHex(items[i].tx_hash));
    }

    return result;
  }

  // 'select distinct `transaction_digests`.`id` from `transaction_digests`
  // left join `transactions_scripts` on `transaction_digests`.`id` = `transactions_scripts`.`transaction_digest_id` where (`script_id` in (?))'
  private async getTxIdsByTypeScriptIds(script: Script): Promise<number[]> {
    if (!script) {
      return [];
    }
    const ids = await this.getScriptIds(script);
    const query = this.db('transaction_digests')
      .leftJoin('transactions_scripts', 'transaction_digests.id', 'transactions_scripts.transaction_digest_id')
      .andWhere(function () {
        return this.whereIn('script_id', ids);
      });

    const items = await query.distinct('transaction_digests.id');
    const result: number[] = [];
    for (let i = 0; i < items.length; i++) {
      result.push(items[i].id);
    }

    return result;
  }

  // 'select * from `scripts` where `code_hash` = ? and substring(args, 1, ?) = ?'
  private async getScriptIds(script: Script) {
    if (!script) {
      return [];
    }
    const argsBuffer = this.hexToNodeBuffer(script.args);
    let query = this.db('scripts');
    query = query.where({
      code_hash: Buffer.from(new Reader(script.codeHash).toArrayBuffer()),
      hash_type: script.hashType === 'data' ? 0 : 1,
    });
    if ('0x' != script.args) {
      query = query.whereRaw('substring(args, 1, ?) = ?', [argsBuffer.byteLength, argsBuffer]);
    }

    // if (this.queryOptions.getArgsLen() !== 'any' && this.queryOptions.getArgsLen() > 0) {
    //   query = query.whereRaw('length(args) = ?', [this.queryOptions.getArgsLen()]);
    // }

    const items = await query.select('id');
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
