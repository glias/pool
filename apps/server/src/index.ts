import Koa from 'koa';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import router from './routes';
import { lumosRepository } from './repository';
import cors from 'koa2-cors';

const app = new Koa();
lumosRepository.init();

// ONLY FOR DEVELOPMENT
app.use(async function (ctx, next) {
  try {
    await next();
  } catch (err) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = { stack: err.stack, message: err.message };
  }
});
app.use(cors());
app.use(json());
app.use(logger());
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Koa started');
});
