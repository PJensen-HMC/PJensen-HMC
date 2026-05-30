export interface LockHandle {
  release(): Promise<void>;
}

export interface CosmosSetOptions {
  ttlSeconds?: number;
}

export interface CosmosLockOptions {
  ttlMs?: number;
  waitMs?: number;
}

export interface CosmosBinding {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, options?: CosmosSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
  increment(key: string, delta?: number): Promise<number>;
  lock(key: string, options?: CosmosLockOptions): Promise<LockHandle>;
}
