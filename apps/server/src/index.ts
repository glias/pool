import Koa from 'koa';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import router from './routes';
import { lumosRepository } from './repository';
import cors from 'koa2-cors';
import { BizException } from './bizException';
import { accessLogger } from './logger';

const app = new Koa();
lumosRepository.init();

// ONLY FOR DEVELOPMENT
app.use(async function (ctx, next) {
  try {
    await next();
  } catch (err) {
    if (err instanceof BizException) {
      ctx.status = 400;
      ctx.body = { message: err.message };
    } else {
      ctx.status = 500;
      ctx.body = { stack: err.stack, message: err.message };
    }
  }
});
app.use(cors());
app.use(json());
app.use(accessLogger);
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Koa started');
});
