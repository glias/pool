import Koa from 'koa';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import router from './routes';
import { lumosRepository } from './repository';
import cors from 'koa2-cors';

const app = new Koa();
lumosRepository.init();

app.use(cors());
app.use(json());
app.use(logger());
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Koa started');
});
