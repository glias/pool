import { Router } from "koa-router";
import { pool } from ""

const router = new Router();

router.post("/v1/liquidity-pool/orders/add-liquidity", pool.addLiquidityOrder);

export { router };
