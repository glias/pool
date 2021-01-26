import { useLocalStorage } from '@rehooks/local-storage';
import { useGliaswap } from 'contexts';

export type GliaswapGlobalSetting = { slippage: number };

export type UseGlobalSetting = [GliaswapGlobalSetting, (setting: GliaswapGlobalSetting) => void];

export function useGlobalSetting(): UseGlobalSetting {
  const { currentUserLock } = useGliaswap();
  const namespace = `settings/${currentUserLock?.args ?? 'defaults'}`;

  const [setting, setSetting] = useLocalStorage<GliaswapGlobalSetting>(namespace, { slippage: 0.005 });
  return [setting, setSetting];
}
