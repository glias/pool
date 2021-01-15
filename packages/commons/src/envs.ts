type Defaults<T extends Record<keyof T, string | number>> = Record<keyof T, string | number>;

export type DefaultVariableMap<Builtins extends Defaults<Builtins>> = {
  set<K extends keyof Builtins>(k: K, v: Builtins[K]): void;
  get<K extends keyof Builtins>(key: K): Builtins[K];
};

export function build<Builtins extends Defaults<Builtins>>(variables: Builtins): DefaultVariableMap<Builtins> {
  return new Map(Object.entries(variables)) as DefaultVariableMap<Builtins>;
}

/**
 * @example
 * ```ts
 * import { envs } from '@gliaswap/commons'
 * envs.set('ERC20_USDT_ADDRESS', '0x...')
 * console.log(envs.get('ERC20_USDT_ADDRESS'))
 * ```
 */
export const envs = build({
  ERC20_USDT_ADDRESS: '0x',
  ERC20_USDC_ADDRESS: '0x',
  ERC20_DAI_ADDRESS: '0x',
});
