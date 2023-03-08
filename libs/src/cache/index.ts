import flatCache from 'flat-cache';
import path from "path";

interface CacheEntry {
  value: any;
  timestamp: number;
}

export interface ICacheConfig {
  cacheName: string;
  cachePath: string;
  saveInterval?: number;
  keyPrefix?: string;
}

export class Cache {
  private readonly cache: any;
  private readonly cacheName: string;
  private readonly keyPrefix: string = '';
  private readonly saveInterval: number = 1000 * 60 * 5; // 5 minutes

  constructor(config: ICacheConfig) {
    const { cacheName, cachePath, saveInterval, keyPrefix } = config;
    this.cache = flatCache.load(cacheName, cachePath);
    this.cacheName = cacheName;
    this.keyPrefix = keyPrefix?.concat("::") || this.keyPrefix;
    this.autoSave(saveInterval || this.saveInterval);
  }

  private formatKey(key: string): string {
    return this.keyPrefix + key;
  }

  private autoSave(interval): void {
    setInterval(() => this.cache.save(true), interval);
  }

  public get(key: string): any {
    const entry: CacheEntry = this.cache.getKey(this.formatKey(key));
    if (entry && !this.isExpired(entry.timestamp)) {
      return entry.value;
    }
    return undefined;
  }

  public has(key: string): boolean {
    return !!this.get(key);
  }

  public getAll(): any {
    const entries = this.cache.all();
    const validEntries = {};
    for (let key in entries) {
      const entry = entries[key];
      key = key.replace(this.keyPrefix, '');
      if (entry && !this.isExpired(entry.timestamp)) {
        validEntries[key] = entry.value;
      }
    }
    return validEntries;
  }

  public set(key: string, value: any, expiresInSec?: number): void {
    const timestamp = expiresInSec
      ? Date.now() + expiresInSec * 1000
      : undefined;
    const entry: CacheEntry = {
      value,
      timestamp,
    };
    this.cache.setKey(this.formatKey(key), entry);
  }

  public truncate(): void {
    this.cache.all().forEach((entry: CacheEntry, key: string) => {
      if (this.isExpired(entry.timestamp)) {
        this.cache.removeKey(this.formatKey(key));
      }
    });
    this.cache.save(true);
  }

  private isExpired(timestamp: number): boolean {
    if (!timestamp) {
      return false;
    }
    return Date.now() > timestamp;
  }
}
