# @gliaswap/cacheable

## Example

```ts
import { cacheable, createExpiredLRUCache } from '@gliaswap/cacheable';

async function fetchTransaction() {
  // ...
}

const cFetchTransaction = cachable(fetchTransaction, {
  // the expired difination of the cache
  cacher: createExpiredLRUCache(100, 20000),
  // the expired difination of the task
  expired: 3000,
  hasher: JSON.stringify,
});
```

## For Class Methods

```ts
import { cacheable } from '@gliaswap/cacheable';

class ClassExample {
  async unbound(input) {}
}

const example = new ClassExample();

const bound = cachebale(example.unbound.bind(example));
// or
const other = cacheable((input) => example.unbound(input));
```
