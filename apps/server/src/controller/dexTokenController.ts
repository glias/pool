// import { ScriptSchema, TokenInfoSchema } from './swaggerSchema';
import * as lumos from '@ckb-lumos/base';
import { formatByteLike } from 'easy-byte'
import * as commons from '@gliaswap/commons';
import { CkbNativeAssetWithBalance } from '@gliaswap/commons';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import { Primitive } from '@gliaswap/types';
import * as pwCore from '@lay2/pw-core';
import { body, Context, description, request, summary, tags } from 'koa-swagger-decorator';
import { Script, Token, TokenHolderFactory, DefaultCellInfoSerializationHolder } from '../model';
import { TokenCellCollectorService, DefaultTokenCellCollectorService } from '../service';

const tokenTag = tags(['Token']);

export default class DexTokenController {
  private readonly service: TokenCellCollectorService;

  constructor() {
    this.service = new DefaultTokenCellCollectorService();
  }

  @request('post', '/v1/get-default-asset-list')
  @summary('Get Token List')
  @description('Get Token List')
  @tokenTag
  public async getDefaultAssetList(ctx: Context): Promise<void> {
    const tokens = TokenHolderFactory.getInstance().getTokens();
    const result = [];
    tokens.forEach((x) => {
      result.push(x.toAsset());
      if (x.shadowFrom) {
        result.push(new Token(null, null, x.shadowFrom, null, null).toAsset());
      }
    });

    ctx.body = result;
  }

  @request('post', '/v1/get-asset-list')
  @summary('Get Asset List')
  @description('Get Asset List')
  @tokenTag
  public async getAssetList(ctx: Context): Promise<void> {
    const name = ctx.request.body.name;

    const _tokens = TokenHolderFactory.getInstance()
      .getTokens()
      .filter((token) => token.info.name === name)
      .map(toCKBAsset);

    ctx.body = body;
  }

  @request('post', '/v1/get-asset-with-balance')
  @summary('Get Asset With Balance')
  @description('Get Asset With Balance')
  @tokenTag
  public async getAssetsWithBalance(ctx: Context): Promise<void> {
    const lock: commons.Script = ctx.request.body.lock;
    const assets: commons.CkbAsset[] = ctx.request.body.assets;

    let tokens = TokenHolderFactory.getInstance().getTokens();
    if (assets) {
      tokens = assets.map((asset) => {
        return TokenHolderFactory.getInstance().getTokenByTypeHash(asset.typeHash);
      });
    }

    const listAssetBalance: commons.GliaswapAssetWithBalance[] = [];

    for (const token of tokens) {
      const primitiveToken: Primitive.Token = {
        balance: '0',
        typeHash: token.typeHash,
        typeScript: token.typeScript ? token.typeScript.toPwScript() : null,
        info: {
          name: token.info.name,
          symbol: token.info.symbol,
          decimals: token.info.decimals,
          logo_uri: token.info.logoURI,
        },
      };
      const cells = await this.service.collect(
        primitiveToken,
        new Script(lock.codeHash, lock.hashType, lock.args).toPwScript(),
      );


      let amount = new DefaultCellInfoSerializationHolder().getSudtCellSerialization().decodeData("0x00");
      let occupiedCapacity = new DefaultCellInfoSerializationHolder().getSudtCellSerialization().decodeData("0x00");
      for (const cell of cells) {
        if (token.typeHash === CKB_TYPE_HASH) {
          if (cell.getHexData() === "0x" && !cell.type) {
            amount += new DefaultCellInfoSerializationHolder().getSudtCellSerialization().decodeData(cell.capacity.toUInt128LE());
          }
          if (cell.getHexData() !== "0x" || cell.type) {
            occupiedCapacity = new DefaultCellInfoSerializationHolder().getSudtCellSerialization().decodeData(cell.occupiedCapacity().toUInt128LE());
          }
        } else {
          if (cell.getHexData() !== "0x" && cell.type) {
            const sudt = new DefaultCellInfoSerializationHolder().getSudtCellSerialization().decodeData(cell.getHexData());
            amount += sudt;
          }
        }
      }

      const ckbAsset = toCKBAsset(token);

      if (token.typeHash === CKB_TYPE_HASH) {
        listAssetBalance.push({
          typeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          balance: amount.toString(),
          locked: '0', // TODO(@zjh): fix it when implementing lp pool.
          occupied: occupiedCapacity.toString(),
          ...ckbAsset,
        } as CkbNativeAssetWithBalance);
      } else {
        listAssetBalance.push({
          typeHash: token.typeHash,
          balance: amount.toString(),
          locked: '0',
          ...ckbAsset,
        });
      }
    }

    ctx.body = listAssetBalance;
  }
}

function toCKBAsset(token: Token): commons.CkbAsset {
  return {
    chainType: 'Nervos',
    name: token.info.name,
    decimals: token.info.decimals,
    symbol: token.info.symbol,
    logoURI: token.info.logoURI,
    typeHash: token.typeHash,
  };
}
