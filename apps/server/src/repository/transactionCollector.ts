import { QueryOptions, Script, ScriptWrapper, utils } from '@ckb-lumos/base';
import { Reader, RPC, validators } from 'ckb-js-toolkit';
import knex from 'knex';

export class TransactionCollector {
  constructor(private knex: knex, private queryOptions: QueryOptions, private rpc: RPC, private includeStatus = true) {
    if (!queryOptions.argsLen) {
      queryOptions.argsLen = -1;
    }

    if (!queryOptions.order) {
      queryOptions.order = 'asc';
    }

    if (!queryOptions.data) {
      queryOptions.data = 'any';
    }

    if (!queryOptions.lock && (!queryOptions.type || queryOptions.type === 'empty')) {
      throw new Error('Either lock or type script must be provided!');
    }

    // Wrap the plain `Script` into `ScriptWrapper`.
    if (queryOptions.lock && !queryOptions.lock['script']) {
      const lock = <Script>queryOptions.lock;
      validators.ValidateScript(lock);
      queryOptions.lock = { script: lock, argsLen: queryOptions.argsLen };
    } else if (queryOptions.lock && queryOptions.lock['script']) {
      const lock = <ScriptWrapper>queryOptions.lock;
      validators.ValidateScript(lock.script);

      // check argsLen
      if (!lock.argsLen) {
        lock.argsLen = queryOptions.argsLen;
      }
    }

    if (queryOptions.type === 'empty') {
      queryOptions.type = queryOptions.type;
    } else if (queryOptions.type && typeof queryOptions.type === 'object' && !queryOptions.type['script']) {
      const type = <Script>queryOptions.type;
      validators.ValidateScript(type);
      queryOptions.type = { script: type, argsLen: queryOptions.argsLen };
    } else if (queryOptions.type && typeof queryOptions.type === 'object' && queryOptions.type['script']) {
      const type = <ScriptWrapper>queryOptions.type;
      validators.ValidateScript(type.script);

      // check argsLen
      if (!type.argsLen) {
        type.argsLen = queryOptions.argsLen;
      }
    }
    if (queryOptions.fromBlock) {
      utils.assertHexadecimal('fromBlock', queryOptions.fromBlock);
    }
    if (queryOptions.toBlock) {
      utils.assertHexadecimal('toBlock', queryOptions.toBlock);
    }
    if (queryOptions.order !== 'asc' && queryOptions.order !== 'desc') {
      throw new Error('Order must be either asc or desc!');
    }
  }

  assembleQuery(order = true): knex.QueryBuilder {
    let query = this.knex('transactions_scripts');
    if (order) {
      query = query.orderBy([
        { column: 'transaction_digests.block_number', order: this.queryOptions.order },
        { column: 'transaction_digests.tx_index', order: this.queryOptions.order },
      ]);
    }
    if (this.queryOptions.fromBlock) {
      query = query.andWhere('transaction_digests.block_number', '>=', this.queryOptions.fromBlock);
    }
    if (this.queryOptions.toBlock) {
      query = query.andWhere('transaction_digests.block_number', '<=', this.queryOptions.toBlock);
    }

    if (this.queryOptions.lock) {
      const lock = <ScriptWrapper>this.queryOptions.lock;
      const binaryArgs = hexToNodeBuffer(lock.script.args);
      let lockQuery = this.knex('scripts')
        .select('id')
        .where({
          code_hash: hexToNodeBuffer(lock.script.code_hash),
          hash_type: lock.script.hash_type === 'type' ? 1 : 0,
        });
      if ('0x' != lock.script.args) {
        lockQuery = lockQuery.whereRaw('substring(args, 1, ?) = ?', [binaryArgs.byteLength, binaryArgs]);
      }

      if (lock.argsLen !== 'any' && lock.argsLen > 0) {
        lockQuery = lockQuery.whereRaw('length(args) = ?', [lock.argsLen]);
      }
      query = query.andWhere(function () {
        return this.whereIn('script_id', lockQuery);
      });
    }
    if (this.queryOptions.type) {
      if (this.queryOptions.type !== 'empty') {
        const typeQuery = this.getTypeHash();
        query = query.andWhere(function () {
          return this.whereIn('transaction_digests.tx_hash', typeQuery);
        });
      } else {
        // query = query.whereNull('script_id');
      }
    }
    if (this.queryOptions.data !== 'any') {
      query = query.andWhere('data', hexToNodeBuffer(this.queryOptions.data));
    }
    if (this.queryOptions.skip) {
      query = query.offset(this.queryOptions.skip);
    }
    return query;
  }

  async getTxHashes(): Promise<string[]> {
    const items = await this.assembleQuery()
      .leftJoin('transaction_digests', 'transactions_scripts.transaction_digest_id', 'transaction_digests.id')
      .select('transaction_digests.*');

    const distinctTxs: Set<string> = new Set();
    const hashes: string[] = [];
    for (let i = 0; i < items.length; i++) {
      const tx = items[i];
      const hash = nodeBufferToHex(tx.tx_hash);
      if (!distinctTxs.has(hash)) {
        distinctTxs.add(hash);
        hashes.push(hash);
      }
    }

    return hashes;
  }

  getTypeHash(order = true): knex.QueryBuilder {
    let query = this.knex('transactions_scripts');
    if (order) {
      query = query.orderBy([
        { column: 'transaction_digests.block_number', order: this.queryOptions.order },
        { column: 'transaction_digests.tx_index', order: this.queryOptions.order },
      ]);
    }
    if (this.queryOptions.fromBlock) {
      query = query.andWhere('transaction_digests.block_number', '>=', this.queryOptions.fromBlock);
    }
    if (this.queryOptions.toBlock) {
      query = query.andWhere('transaction_digests.block_number', '<=', this.queryOptions.toBlock);
    }

    const type = <ScriptWrapper>this.queryOptions.type;
    const typeBinaryArgs = hexToNodeBuffer(type.script.args);
    let typeQuery = this.knex('scripts')
      .select('id')
      .where({
        code_hash: hexToNodeBuffer(type.script.code_hash),
        hash_type: type.script.hash_type === 'type' ? 1 : 0,
      })
      .whereRaw('substring(args, 1, ?) = ?', [typeBinaryArgs.byteLength, typeBinaryArgs]);
    if (type.argsLen !== 'any' && type.argsLen > 0) {
      typeQuery = typeQuery.whereRaw('length(args) = ?', [type.argsLen]);
    }

    query = query
      .andWhere(function () {
        return this.whereIn('script_id', typeQuery);
      })
      .leftJoin('transaction_digests', 'transactions_scripts.transaction_digest_id', 'transaction_digests.id')
      .select('transaction_digests.tx_hash');

    return query;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async *collect(): AsyncGenerator<any, void, unknown> {
    const hashes = await this.getTxHashes();

    for (const hash of hashes) {
      const tx = await this.rpc.get_transaction(hash);
      if (this.includeStatus) {
        yield tx;
      } else {
        yield tx.transaction;
      }
    }
  }
}

function nodeBufferToHex(b) {
  return new Reader(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)).serializeJson();
}

function hexToNodeBuffer(b) {
  return Buffer.from(new Reader(b).toArrayBuffer());
}
