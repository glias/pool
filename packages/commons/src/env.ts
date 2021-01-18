export type Env<O extends Record<string, string | number>> = {
  set<K extends keyof O>(k: K, v: O[K]): void;
  get<K extends keyof O>(key: K): O[K];
};

export function buildEnv<O extends Record<string, string | number>>(variables: O): Env<O> {
  return (new Map(Object.entries(variables)) as unknown) as Env<O>;
}

/**
 * @example
 * ```ts
 * import { CommonsEnv } from '@gliaswap/commons'
 * CommonsEnv.set('ERC20_USDT_ADDRESS', '0x...')
 * console.log(CommonsEnv.get('ERC20_USDT_ADDRESS'))
 * ```
 */
export const CommonsEnv = buildEnv({
  ERC20_USDT_ADDRESS: '0x',
  ERC20_USDC_ADDRESS: '0x',
  ERC20_DAI_ADDRESS: '0x',
});
