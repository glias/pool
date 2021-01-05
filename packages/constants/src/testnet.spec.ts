import { testNet } from './';

test('hello test', async () => {
  expect(testNet.SUDT_TYPE_CODE_HASH).toEqual('0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4');

  const val = await new Promise((resolve) => {
    setTimeout(() => resolve(testNet.SUDT_TYPE_CODE_HASH), 100);
  });

  expect(val).toEqual('0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4');
});
