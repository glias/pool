import LZString from 'lz-string';

export class LzCache {
  static compress(value: string): string {
    return LZString.compress(value);
  }

  static decompress(value: string): string {
    return LZString.decompress(value);
  }
}
