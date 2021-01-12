import { testNet } from '@gliaswap/constants';

import Koa from 'koa';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';

const app = new Koa();

app.use(json());
app.use(logger());
app.use(bodyParser());

app.listen(3000, () => {
  console.log('Koa started');
});
