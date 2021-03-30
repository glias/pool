import { LRUMap } from 'lru_map';

type Maybe<T> = T | null;
type Promiseable<T> = T | Promise<T>;

export interface Cacher<K, V> {
  has: (k: K) => Promiseable<boolean>;
  get: (k: K) => Promiseable<Maybe<V>>;
  set: (k: K, v: V) => Promiseable<void>;
  delete: (k: K) => Promiseable<V>;
}

export function createExpiredLRUCache<T>(limit = 100, expired = 20000): Cacher<string, T> {
  const cache = new LRUMap<string, T>(limit);
  const expiredMap = new Map<string, ReturnType<typeof setTimeout>>();

  function get(key: string) {
    return cache.get(key);
  }

  function set(key: string, v: T) {
    cache.set(key, v);
    clearTimeout(expiredMap.get(key));
    expiredMap.set(
      key,
      setTimeout(() => {
        expiredMap.delete(key);
        cache.delete(key);
      }, expired),
    );
  }

  function del(key) {
    expiredMap.delete(key);
    return cache.delete(key);
  }

  function has(key) {
    return cache.has(key);
  }

  return { get, set, delete: del, has };
}

export interface Hasher {
  hash: (...input: unknown[]) => string;
}

export function createDefaultHasher(): Hasher {
  return {
    hash: function defaultHash(...input: unknown[]) {
      return JSON.stringify(input);
    },
  };
}

export interface Options<V> {
  hasher?: Hasher;
  cacher?: Cacher<string, V>;
  expired?: number; // ms
}

export function cacheable<F extends (...input: unknown[]) => Promise<unknown>>(
  fn: F,
  options: Options<unknown> = {},
): typeof fn {
  const { expired = 3000, cacher = createExpiredLRUCache(), hasher = createDefaultHasher() } = options;

  const lockingTasks = new Map<string, number>();
  const runningTasks = new Map<string, Promise<unknown>>();

  async function runTask(key: string, ...input: unknown[]) {
    if (lockingTasks.has(key)) return runningTasks.get(key);

    const task = fn(...input);

    lockingTasks.set(key, Date.now());
    runningTasks.set(key, task);

    Promise.resolve(task).then(
      async (result) => {
        cacher.set(key, result);
        runningTasks.delete(key);
        setTimeout(() => lockingTasks.delete(key), expired);
      },
      () => {
        runningTasks.delete(key);
        lockingTasks.delete(key);
      },
    );

    return task;
  }

  const memoizedFn = async (...input: unknown[]) => {
    const key = hasher.hash(...input);
    const isExpired = Date.now() - (lockingTasks.get(key) ?? 0) > expired;
    if (isExpired) runTask(key, ...input);

    return cacher.has(key) ? cacher.get(key) : runTask(key, ...input);
  };

  return memoizedFn as typeof fn;
}
