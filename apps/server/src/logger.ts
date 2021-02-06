import log4js from 'koa-log4';
import * as Koa from 'koa';
import path from 'path';
log4js.configure({
  appenders: {
    pool: {
      type: 'dateFile',
      filename: path.join('logs/', 'pool'),
      pattern: '.yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      encoding: 'utf-8',
      maxLogSize: 1024,
      backups: 10,
      // compress: true,
    },
    console: { type: 'console' },
  },
  categories: { default: { appenders: ['pool', 'console'], level: 'info' } },
});
export const Logger: log4js.Logger = log4js.getLogger();
export const accessLogger: Koa.Middleware = log4js.koaLogger(log4js.getLogger());
