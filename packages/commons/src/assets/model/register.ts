import { Asset, ChainSpec } from '..';
import { Maybe } from '../../types';
import { AssetModel } from './define';

interface GetAssetModel<M> {
  <Name extends keyof M>(name: Name): Name extends keyof M ? Maybe<M[Name]> : never;

  <Spec extends ChainSpec>(spec: Spec): Spec extends ChainSpec<infer Name>
    ? Name extends keyof M
      ? Maybe<M[Name]>
      : undefined
    : never;
}

export type ModelMap<M> = {
  get: GetAssetModel<M>;
  register: <M2 extends AssetModel<Asset>>(
    model: M2,
  ) => M2 extends AssetModel<infer A> ? ModelMap<M & Record<A['chainType'], M2>> : ModelMap<M>;
};

export function registerModelMap(): ModelMap<unknown> {
  const models = new Map<string, AssetModel<Asset, ChainSpec>>();

  function get(key: string) {
    return models.get(key);
  }

  function register(model: AssetModel<Asset, ChainSpec>) {
    models.set(model.chainType, model);
    return map;
  }

  const map = { get, register };

  return map as ModelMap<unknown>;
}
