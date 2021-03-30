export interface DexCache {
  set: (key: string, value: string) => void;

  setEx: (key: string, value: string, seconds: number) => void;

  get: (key: string) => Promise<string>;

  getLock: (key: string, seconds: number) => Promise<boolean>;
}
