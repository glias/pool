import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import json from 'koa-json';
import cors from 'koa2-cors';
import { BizException } from './bizException';
import { accessLogger, Logger } from './logger';
import { lumosRepository } from './repository';
import router from './routes';

const app = new Koa();
lumosRepository.init();

// ONLY FOR DEVELOPMENT
app.use(async function (ctx, next) {
  try {
    await next();
  } catch (err) {
    Logger.error(err);
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

const port = process.env.HTTP_LISTEN_PORT;
app.listen(Number(port == null ? 3000 : port), () => {
  console.log('Koa started');
});
