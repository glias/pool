import { truncateMiddle } from '.';

test('truncateMiddle', () => {
  expect(truncateMiddle('012345678901234')).toEqual('012345...901234');
  expect(truncateMiddle('01234567')).toEqual('01234567');
  expect(truncateMiddle('01234567',2)).toEqual('01...67');
});
