import { PoolInfoFactory, TokenHolderFactory } from '../../../model';

const quoteBaseHash: Record<string, string> = {
  GLIA: '0xbfb315567328439666a3a56a3f5cf7ea671142c24189404c306c5ffd5a3a11d0',
  ckETH: '0x2bcb3284b31c158289675e6aa034a8bbb4f5983d7ced89fea55ebadd35a04837',
  ckDAI: '0xb9ccb77c0ae17a96acd2faa73c62c41b03bdd3d75c28eb30e814bdba5c49a48d',
  ckUSDC: '0xdedbf35f9640cfdc3cc0de40ffd99d5d49ba3ef7325f5ad2180aa4a92358eb51',
  ckUSDT: '0xb57fe9c1686c36acf1654c971144b3ccd6699a0ab8eddba3eaf7ea4529be7c44',
};

test('get quote/base ', () => {
  const quoteBase = PoolInfoFactory.getQuoteBase(quoteBaseHash.GLIA);
  expect(quoteBase.baseToken.typeHash).toEqual(TokenHolderFactory.getInstance().getTokenBySymbol('GLIA').typeHash);
});
