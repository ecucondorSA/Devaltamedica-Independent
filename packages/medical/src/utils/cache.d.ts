/**
 * Medical Cache Utility
 * HIPAA-compliant caching for medical data
 */
export declare const medicalCacheVersion = "1.0.0";
interface CacheOptions {
    ttl?: number;
    encrypt?: boolean;
}
/**
 * Medical cache implementation for development
 * TODO: Implement real caching with encryption for PHI data
 */
export declare const medicalCache: {
    /**
     * Get value from cache
     */
    get: <T = any>(key: string) => Promise<T | null>;
    /**
     * Set value in cache with optional TTL
     */
    set: <T = any>(key: string, value: T, options?: CacheOptions) => Promise<boolean>;
    /**
     * Delete value from cache
     */
    delete: (key: string) => Promise<boolean>;
    /**
     * Clear all cache entries
     * Use with caution - requires admin permissions
     */
    clear: () => Promise<boolean>;
    /**
     * Check if key exists in cache
     */
    has: (key: string) => Promise<boolean>;
    /**
     * Get multiple values from cache
     */
    getMany: <T = any>(keys: string[]) => Promise<Map<string, T | null>>;
};
export default medicalCache;
//# sourceMappingURL=cache.d.ts.map