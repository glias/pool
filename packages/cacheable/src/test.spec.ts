import { cacheable } from './';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createFakeTask<X>(ms = 50): (x: X) => Promise<X> {
  return (input: X) => sleep(ms).then(() => input);
}

test('cache should work correct', async () => {
  const fetch = cacheable(createFakeTask(50), { expired: 100 });

  const obj1 = await fetch({});
  const obj2 = await fetch({});
  expect(obj1 === obj2).toBe(true);

  // after 50 ms, the cache has not yet expired,
  // so the results should still be returned from the cache
  await sleep(50);
  const obj3 = await fetch({});
  expect(obj1 === obj3).toBe(true);

  // after 110 ms, the cache is expired,
  // should re-fetch but still return from the cache until the cache is refreshed
  await sleep(60);
  const obj4 = await fetch({});
  expect(obj1 === obj4);

  // after 160ms, the second fetch is completed,
  // so the cache should be refreshed with the new object
  await sleep(50);
  const obj5 = await fetch({});
  expect(obj1 === obj5).toBe(false);
});

class ClassExample {
  prop: string;

  constructor() {
    this.prop = 'this prop';
  }

  async unbound(x: unknown): Promise<unknown> {
    if (!this || !this.prop) throw new Error('this.prop is not found');
    return sleep(50).then(() => x);
  }

  bound = (x: unknown) => {
    if (!this || !this.prop) throw new Error('this.prop is not found');
    return sleep(50).then(() => x);
  };
}

test('test with class with bound', async () => {
  expect.assertions(2);

  const clazz = new ClassExample();

  const bound = cacheable(clazz.bound);
  expect((await bound({})) === (await bound({}))).toBe(true);

  const unbound = cacheable(clazz.unbound);
  await expect(unbound({})).rejects.toEqual(new Error('this.prop is not found'));
});
