import * as path from 'path';
import { SwaggerRouter } from 'koa-swagger-decorator';

const router = new SwaggerRouter();

router.swagger({
  title: 'POOL',
  description: 'API DOC',
  version: '1.0.0',
});

router.mapDir(path.resolve(__dirname, './controller/'));
export default router;
