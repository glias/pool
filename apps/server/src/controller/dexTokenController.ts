import { body, Context, request, responses, summary, tags, description } from 'koa-swagger-decorator';
import { TokenTokenHolderFactory, Token, Script } from '../model';
import { TokenCellCollectorService } from '../service';
// import { ScriptSchema, TokenInfoSchema } from './swaggerSchema';

import * as lumos from '@ckb-lumos/base';
import * as pwCore from '@lay2/pw-core';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import * as commons from '@gliaswap/commons';
import { Primitive } from '@gliaswap/types';

const tokenTag = tags(['Token']);

export default class DexTokenController {
  private readonly service: TokenCellCollectorService;

  constructor(service: TokenCellCollectorService) {
    this.service = service;
  }

  @request('post', '/v1/get-default-asset-list')
  @summary('Get Token List')
  @description('Get Token List')
  @tokenTag
  public async getDefaultAssetList(ctx: Context): Promise<void> {
    const tokens = TokenTokenHolderFactory.getInstance().getTokens();
    const assets = tokens.map(toCKBAsset);

    ctx.body = assets;
  }

  public async getAssetList(ctx: Context): Promise<void> {
    const name = ctx.request.body.name;

    const tokens = TokenTokenHolderFactory.getInstance()
      .getTokens()
      .filter(token => token.info.name === name)
      .map(toCKBAsset);

    ctx.body = body;
  }

  public async getAssetsWithBalance(ctx: Context): Promise<void> {
    const lock: commons.Script = ctx.request.body.lock;
    const assets: commons.CkbAsset[] = ctx.request.body.assets;

    let tokens = TokenTokenHolderFactory.getInstance().getTokens();
    if (assets) {
      tokens = assets.map(asset => {
        return TokenTokenHolderFactory.getInstance().getTokenByTypeHash(asset.typeHash);
      });
    }

    const listAssetBalance: commons.GliaswapAssetWithBalance[] = [];

    for (const token of tokens) {
      const primitiveToken: Primitive.Token = {
        balance: "0",
        typeHash: token.typeHash,
        typeScript: token.typeScript.toPwScript(),
        info: {
          name: token.info.name,
          symbol: token.info.symbol,
          decimals: token.info.decimal,
          logo_uri: token.info.logoUri,
        }
      };
      const cells = await this.service.collect(primitiveToken, new Script(lock.codeHash, lock.hashType, lock.args).toPwScript());

      const amount = new pwCore.Amount("0", token.info.decimal);
      const occupiedCapacity = new pwCore.Amount("0", token.info.decimal);
      for (const cell of cells) {
        if (token.typeHash === CKB_TYPE_HASH) {
          occupiedCapacity.add(cell.occupiedCapacity());
          amount.add(cell.capacity);
        } else {
          amount.add(new pwCore.Amount(
            lumos.utils
              .readBigUInt128LE(cell.getHexData()).toString())
          );
        }
      }

      const ckbAsset = toCKBAsset(token);
      
      if (token.typeHash === CKB_TYPE_HASH) {
        listAssetBalance.push({
          typeHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
          balance: amount.toUInt128LE(),
          locked: "0", // TODO(@zjh): fix it when implementing lp pool.
          occupied: occupiedCapacity.toUInt128LE(),
          ...ckbAsset,
        });
      } else {
        listAssetBalance.push({
          typeHash: token.typeHash,
          balance: amount.toUInt128LE(),
          locked: "0",
          ...ckbAsset,
        });
      }
     
    }

    ctx.body = listAssetBalance;
  }
}


function toCKBAsset(token: Token): commons.CkbAsset {
  return {
    chainType: "Nervos",
    name: token.info.name,
    decimals: token.info.decimal,
    symbol: token.info.symbol,
    logoURI: token.info.logoUri,
    typeHash: token.typeHash,
  }
}
