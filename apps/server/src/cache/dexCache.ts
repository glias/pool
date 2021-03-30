export interface DexCache {
  set: (key: string, value: string) => void;

  setEx: (key: string, value: string) => void;

  get: (key: string) => Promise<string>;

  getLock: (key: string, time: number) => Promise<boolean>;
}
