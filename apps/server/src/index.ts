import Koa from 'koa';
import logger from 'koa-logger';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
// import yamljs from 'yamljs';
// import { koaSwagger } from 'koa2-swagger-ui';

import router from './routes';

// const spec = yamljs.load('./swagger-api/api.yaml');
// router.get('/docs', koaSwagger({ routePrefix: false, swaggerOptions: { spec } }));

const app = new Koa();

app.use(json());
app.use(logger());
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Koa started');
});
