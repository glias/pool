import * as commons from '@gliaswap/commons';
import { CkbNativeAssetWithBalance } from '@gliaswap/commons';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import { body, Context, description, request, summary, tags } from 'koa-swagger-decorator';
import { Token, TokenHolderFactory, cellConver, CellInfoSerializationHolderFactory } from '../model';
import { ckbRepository, DexRepository } from '../repository';
import { TokenCellCollectorService, DefaultTokenCellCollectorService } from '../service';

const tokenTag = tags(['Token']);

export default class DexTokenController {
  private readonly service: TokenCellCollectorService;
  private readonly dexRepository: DexRepository;

  constructor() {
    this.service = new DefaultTokenCellCollectorService();
    this.dexRepository = ckbRepository;
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
    const lock = cellConver.converScript(ctx.request.body.lock);
    const assets: commons.CkbAsset[] = ctx.request.body.assets;

    let tokens = TokenHolderFactory.getInstance().getTokens();
    if (assets) {
      tokens = assets.map((asset) => {
        return TokenHolderFactory.getInstance().getTokenByTypeHash(asset.typeHash);
      });
    }

    const listAssetBalance = [];

    for (const token of tokens) {
      if (token.typeHash === CKB_TYPE_HASH) {
        const cells = await this.dexRepository.collectCells({
          lock: lock.toLumosScript(),
        });
        const normalCells = cells.filter((cell) => cell.data === '0x' && !cell.cellOutput.type);

        const balance = normalCells.reduce((total, cell) => total + BigInt(cell.cellOutput.capacity), BigInt(0));

        const occupiedCells = cells.filter((cell) => cell.data !== '0x' || cell.cellOutput.type);

        const occupiedBalance = occupiedCells.reduce(
          (total, cell) => total + BigInt(cell.cellOutput.capacity),
          BigInt(0),
        );

        const ckbAsset = toCKBAsset(token);
        listAssetBalance.push({
          typeHash: CKB_TYPE_HASH,
          balance: balance.toString(),
          locked: '0', // TODO(@zjh): fix it when implementing lp pool.
          occupied: occupiedBalance.toString(),
          ...ckbAsset,
        } as CkbNativeAssetWithBalance);
      } else {
        const cells = await this.dexRepository.collectCells({
          lock: lock.toLumosScript(),
          type: token.typeScript.toLumosScript(),
        });
        let balance = BigInt(0);
        cells.forEach((x) => {
          balance += CellInfoSerializationHolderFactory.getInstance().getSudtCellSerialization().decodeData(x.data);
        });
        token.balance = balance.toString();
        listAssetBalance.push(token.toAsset());
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
