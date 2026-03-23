export interface CachePort {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    deleteByPattern(pattern: string): Promise<void>;
}
