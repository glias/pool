export function has<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  if (!obj) return false;
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function propEq<K extends string, V>(obj: unknown, key: K, value: V): obj is Record<K, V> {
  return has(obj, key) && obj[key] === value;
}

export function prop<V>(obj: unknown, key: string): V | undefined {
  if (!has(obj, key)) return undefined;
  return obj[key] as V;
}
