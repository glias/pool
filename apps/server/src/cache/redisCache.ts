import redis from 'redis';

import { redisConfiguration } from '../config';
import { DexCache } from './dexCache';

class RedisCache implements DexCache {
  private readonly client: redis.RedisClient;

  constructor() {
    this.client = redis.createClient(<number>redisConfiguration.port, redisConfiguration.address, {
      db: redisConfiguration.db,
    });
    this.client.auth(redisConfiguration.auth);
  }

  async get(key: string): Promise<string> {
    const value = await new Promise((resolve) => {
      this.client.get(key, (err, res) => {
        if (err) {
          return resolve(null);
        }
        return resolve(res);
      });
    });

    return <string>value;
  }

  set(key: string, value: string): void {
    this.client.set(key, value);
  }

  setEx(key: string, value: string, seconds: number): void {
    this.client.setex(key, seconds, value);
  }

  async getLock(key: string, seconds: number): Promise<boolean> {
    for (let i = 0; i < seconds; i++) {
      const value = await this.get(key);
      if (value) {
        await this.sleep(1000);
      } else {
        this.setEx(key, key, 30);
        return true;
      }
    }

    return false;
  }

  async sleep(ms: number): Promise<void> {
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  }
}

export const dexCache: DexCache = new RedisCache();
