import * as commons from '@gliaswap/commons';
import { CKB_TYPE_HASH } from '@gliaswap/constants';
import { body, Context, description, request, summary, tags } from 'koa-swagger-decorator';
import { Token, TokenHolderFactory, cellConver, CellInfoSerializationHolderFactory } from '../model';
import { ckbRepository, DexRepository } from '../repository';
import { TokenCellCollectorService, DefaultTokenCellCollectorService, tokenService, TokenService } from '../service';
import { Logger } from '../logger';
import { BizException } from '../bizException';

const tokenTag = tags(['Token']);

export default class DexTokenController {
  private readonly service: TokenCellCollectorService;
  private readonly dexRepository: DexRepository;
  private readonly tokenService: TokenService;

  constructor() {
    this.service = new DefaultTokenCellCollectorService();
    this.dexRepository = ckbRepository;
    this.tokenService = tokenService;
  }

  @request('post', '/v1/tokens/search')
  @summary('Search by typeHash or address')
  @description('Search by typeHash or address')
  @tokenTag
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeHashOrAddress: { type: 'string', required: true },
  })
  async typeHash(ctx: Context): Promise<void> {
    const typeHashOrAddress = ctx.request.body.typeHashOrAddress;
    try {
      const tokenInfo = await this.tokenService.getTokesByTypeHashOrAddress(typeHashOrAddress);
      ctx.body = tokenInfo;
    } catch (error) {
      Logger.error(error);
    }
  }

  @request('post', '/v1/tokens/cell-info')
  @summary('Query cell info')
  @description('Query cell info')
  @tokenTag
  @body({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeHash: { type: 'string', required: true },
  })
  async cellInfo(ctx: Context): Promise<void> {
    const typeHash = ctx.request.body.typeHash;
    const cellInfo = await this.tokenService.getCellInfoByTypeHash(typeHash);
    if (!cellInfo) {
      throw new BizException('cell info does not exist');
    }
    ctx.body = cellInfo;
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
        result.push(x.toERC20Token().toAsset());
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
        const cells = await this.dexRepository.collectCells(
          {
            lock: lock.toLumosScript(),
          },
          true,
          true,
        );
        const normalCells = cells.filter((cell) => cell.data === '0x' && !cell.cellOutput.type);

        const balance = normalCells.reduce((total, cell) => total + BigInt(cell.cellOutput.capacity), BigInt(0));

        const occupiedCells = cells.filter((cell) => cell.data !== '0x' || cell.cellOutput.type);

        const occupiedBalance = occupiedCells.reduce(
          (total, cell) => total + BigInt(cell.cellOutput.capacity),
          BigInt(0),
        );

        token.balance = balance.toString();
        listAssetBalance.push({
          ...token.toAsset(),
          locked: '0', // TODO(@zjh): fix it when implementing lp pool.
          occupied: occupiedBalance.toString(),
        });
      } else {
        const cells = await this.dexRepository.collectCells(
          {
            lock: lock.toLumosScript(),
            type: token.typeScript.toLumosScript(),
          },
          true,
          true,
        );
        let balance = BigInt(0);
        cells.forEach((x) => {
          balance += CellInfoSerializationHolderFactory.getInstance().getSudtCellSerialization().decodeData(x.data);
        });
        token.balance = balance.toString();
        listAssetBalance.push({
          ...token.toAsset(),
          locked: '0', // TODO(@zjh): fix it when implementing lp pool.
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
