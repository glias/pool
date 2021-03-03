import { QueryOptions } from '@ckb-lumos/base';
import * as ckbCoreUtils from '@nervosnetwork/ckb-sdk-utils';
import { ckbRepository, DexRepository, tokenRepository, TokenRepository } from '../repository';
import { Token, TokenInfo } from '../model';

export interface TokenService {
  getTokesByTypeHashOrAddress(typeHashOrAddress: string): Promise<Token[]>;
  getCellInfoByTypeHash(typeHash: string): Promise<Token>;
}

interface SudtInfoData {
  name: string;
  symbol: string;
  decimal: number;
}

class CkbTokenService implements TokenService {
  private readonly type_code_hash: string = '0x72f3d72944f29511eedf806d4b12d77ca0a5cfbb2000d059d8898d283971b579';

  private readonly tokenRepository: TokenRepository;
  private readonly dexRepository: DexRepository;

  constructor() {
    this.dexRepository = ckbRepository;
    this.tokenRepository = tokenRepository;
  }

  async getTokesByTypeHashOrAddress(typeHashOrAddress: string): Promise<Token[]> {
    const tokens: Token[] = [];
    const token = this.getTokenInfoByTypeHash(typeHashOrAddress);
    if (token) {
      tokens.push(token);
    }

    const tokenList = this.getTokenInfoByAddress(typeHashOrAddress);
    if (tokenList) {
      tokenList.forEach((x) => tokens.push(x));
    }

    return tokens;
  }

  async getCellInfoByTypeHash(typeHash: string): Promise<Token> {
    const token = this.getTokenInfoByTypeHash(typeHash);
    if (!token) {
      return undefined;
    }

    const queryOption: QueryOptions = {
      type: {
        code_hash: this.type_code_hash,
        hash_type: 'type',
        args: ckbCoreUtils.scriptToHash(ckbCoreUtils.addressToScript(token.info.address)),
      },
    };

    const sudtInfoCell = await this.dexRepository.collectCells(queryOption);
    if (sudtInfoCell.length === 0) {
      return undefined;
    }

    const sudtInfoData = this.parseSudtInfo(sudtInfoCell[0].data);

    // const sudtTokenInfo: SudtTokenInfo = {
    //   name: sudtInfoData.name,
    //   symbol: sudtInfoData.symbol,
    //   decimal: sudtInfoData.decimal,
    //   address: token.address,
    //   amount: undefined,
    //   chainName: 'ckb',
    //   typeHash: undefined,
    // };

    const tokenInfo: TokenInfo = new TokenInfo(
      sudtInfoData.name,
      sudtInfoData.symbol,
      sudtInfoData.decimal,
      '',
      token.info.address,
      'Nervos',
    );
    const result: Token = new Token(token.typeHash, token.typeScript ? token.typeScript : null, tokenInfo);

    return result;
  }

  private parseSudtInfo(cellData: string): SudtInfoData {
    const decimalBuf: Buffer = Buffer.from(cellData.slice(2, 4), 'hex');
    const decimal = decimalBuf.readUInt8();

    const nameAndSymbol = cellData.slice(4, cellData.length);
    const arr = [];
    for (let i = 0; i < nameAndSymbol.length; i = i + 2) {
      const num = parseInt(nameAndSymbol.substr(i, 2), 16);
      arr.push(String.fromCharCode(num));
    }

    const sudtInfoData: SudtInfoData = {
      name: arr
        .splice(1, arr.lastIndexOf('\n') - 1)
        .toString()
        .replace(new RegExp(',', 'g'), ''),
      symbol: arr
        .splice(arr.lastIndexOf('\n') + 1, arr.length)
        .toString()
        .replace(new RegExp(',', 'g'), ''),
      decimal: decimal,
    };

    return sudtInfoData;
  }

  private getTokenInfoByTypeHash(typeHash: string): Token {
    return this.tokenRepository.getGroupByTypeHash().get(typeHash);
  }

  private getTokenInfoByAddress(address: string): Token[] {
    return this.tokenRepository.getGroupByAddress().get(address);
  }
}

export const tokenService = new CkbTokenService();
