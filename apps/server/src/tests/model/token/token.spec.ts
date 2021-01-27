import { TokenHolderFactory } from '../../../../src/model';

test('token factory', () => {
  const token = TokenHolderFactory.getInstance().getTokenBySymbol('GLIA');
  expect(token.info.symbol).toEqual('GLIA');
});

test('getTokenByShadowFromAddress()', () => {
  const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
  const token = TokenHolderFactory.getInstance().getTokenByShadowFromAddress(ETH_ADDRESS);

  expect(token.info.symbol).toEqual('ckETH');
});

test('call getTokenByShadowFromAddress() to ignore lower case and up case', () => {
  const DAI_ADDRESS = '0xC4401D8D5F05B958e6f1b884560F649CdDfD9615';
  const token = TokenHolderFactory.getInstance().getTokenByShadowFromAddress(DAI_ADDRESS);

  expect(token.info.symbol).toEqual('ckDAI');
});
