import Koa from 'koa';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import router from './routes';
import { indexer } from './repository/indexer';

const app = new Koa();
indexer.init();

app.use(json());
app.use(logger());
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Koa started');
});
