import knex from 'knex';
import { RPC as ToolKitRpc } from 'ckb-js-toolkit';
import { mysqlInfo } from '../../config';
import { TransactionCollector2 } from '../../repository/tx/transactionCollector2';
import { LzCache } from '../../repository/tx/zipCache';
import { mockSwapOrder } from '../mock_data';

describe('tx collector', () => {
  // beforeEach(() => {});
  //
  // afterEach(function () {});

  it('zip tx', async () => {
    const value = JSON.stringify(mockSwapOrder);
    const value2 = LzCache.compress(value);
    console.log(value.length);
    console.log(value2.length);
  });
});
