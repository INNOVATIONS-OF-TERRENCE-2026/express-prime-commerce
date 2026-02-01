/**
 * Embeddings Cache - Persistent session storage for AI embeddings
 * 
 * Provides fast retrieval of pre-computed embeddings to avoid
 * redundant model inference. Uses IndexedDB for persistence.
 * 
 * @module embeddingsCache
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EmbeddingEntry {
  id: string;
  embedding: number[];
  timestamp: number;
  model: string;
  type: 'product' | 'image' | 'text' | 'query';
}

export interface CacheStats {
  totalEntries: number;
  productEmbeddings: number;
  imageEmbeddings: number;
  textEmbeddings: number;
  cacheHitRate: number;
  lastCleanup: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DB_NAME = 'expressprime-ai-cache';
const DB_VERSION = 1;
const STORE_NAME = 'embeddings';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ENTRIES = 10000;

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

const memoryCache = new Map<string, EmbeddingEntry>();
const metrics: CacheMetrics = { hits: 0, misses: 0 };

// ============================================================================
// INDEXEDDB OPERATIONS
// ============================================================================

let db: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('model', 'model', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Get embedding from cache
 */
export async function getEmbedding(id: string): Promise<number[] | null> {
  // Check memory cache first
  const memEntry = memoryCache.get(id);
  if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL) {
    metrics.hits++;
    return memEntry.embedding;
  }

  // Check IndexedDB
  if (!isIndexedDBAvailable()) {
    metrics.misses++;
    return null;
  }

  try {
    const database = await openDB();
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const entry = request.result as EmbeddingEntry | undefined;
        if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
          // Populate memory cache
          memoryCache.set(id, entry);
          metrics.hits++;
          resolve(entry.embedding);
        } else {
          metrics.misses++;
          resolve(null);
        }
      };

      request.onerror = () => {
        metrics.misses++;
        resolve(null);
      };
    });
  } catch {
    metrics.misses++;
    return null;
  }
}

/**
 * Set embedding in cache
 */
export async function setEmbedding(
  id: string,
  embedding: number[],
  type: EmbeddingEntry['type'],
  model: string
): Promise<void> {
  const entry: EmbeddingEntry = {
    id,
    embedding,
    timestamp: Date.now(),
    model,
    type,
  };

  // Always set in memory cache
  memoryCache.set(id, entry);

  // Persist to IndexedDB
  if (!isIndexedDBAvailable()) return;

  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
  } catch (error) {
    console.warn('Failed to persist embedding:', error);
  }
}

/**
 * Batch get embeddings
 */
export async function batchGetEmbeddings(
  ids: string[]
): Promise<Map<string, number[]>> {
  const results = new Map<string, number[]>();
  const missing: string[] = [];

  // Check memory cache first
  for (const id of ids) {
    const memEntry = memoryCache.get(id);
    if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL) {
      results.set(id, memEntry.embedding);
      metrics.hits++;
    } else {
      missing.push(id);
    }
  }

  if (missing.length === 0 || !isIndexedDBAvailable()) {
    metrics.misses += missing.length;
    return results;
  }

  // Batch fetch from IndexedDB
  try {
    const database = await openDB();
    await Promise.all(
      missing.map(
        (id) =>
          new Promise<void>((resolve) => {
            const tx = database.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
              const entry = request.result as EmbeddingEntry | undefined;
              if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
                memoryCache.set(id, entry);
                results.set(id, entry.embedding);
                metrics.hits++;
              } else {
                metrics.misses++;
              }
              resolve();
            };

            request.onerror = () => {
              metrics.misses++;
              resolve();
            };
          })
      )
    );
  } catch {
    metrics.misses += missing.length;
  }

  return results;
}

/**
 * Batch set embeddings
 */
export async function batchSetEmbeddings(
  entries: Array<{
    id: string;
    embedding: number[];
    type: EmbeddingEntry['type'];
    model: string;
  }>
): Promise<void> {
  const timestamp = Date.now();

  // Set all in memory
  for (const entry of entries) {
    memoryCache.set(entry.id, { ...entry, timestamp });
  }

  // Batch persist to IndexedDB
  if (!isIndexedDBAvailable()) return;

  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const entry of entries) {
      store.put({ ...entry, timestamp });
    }
  } catch (error) {
    console.warn('Failed to batch persist embeddings:', error);
  }
}

/**
 * Clear expired entries
 */
export async function cleanupCache(): Promise<number> {
  let cleaned = 0;
  const now = Date.now();

  // Clean memory cache
  for (const [id, entry] of memoryCache) {
    if (now - entry.timestamp > CACHE_TTL) {
      memoryCache.delete(id);
      cleaned++;
    }
  }

  // Clean IndexedDB
  if (!isIndexedDBAvailable()) return cleaned;

  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const cutoff = now - CACHE_TTL;

    const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

    await new Promise<void>((resolve) => {
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cleaned++;
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => resolve();
    });
  } catch (error) {
    console.warn('Cache cleanup failed:', error);
  }

  return cleaned;
}

/**
 * Clear all cache entries
 */
export async function clearCache(): Promise<void> {
  memoryCache.clear();
  metrics.hits = 0;
  metrics.misses = 0;

  if (!isIndexedDBAvailable()) return;

  try {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  const stats: CacheStats = {
    totalEntries: memoryCache.size,
    productEmbeddings: 0,
    imageEmbeddings: 0,
    textEmbeddings: 0,
    cacheHitRate:
      metrics.hits + metrics.misses > 0
        ? metrics.hits / (metrics.hits + metrics.misses)
        : 0,
    lastCleanup: 0,
  };

  // Count by type
  for (const entry of memoryCache.values()) {
    switch (entry.type) {
      case 'product':
        stats.productEmbeddings++;
        break;
      case 'image':
        stats.imageEmbeddings++;
        break;
      case 'text':
      case 'query':
        stats.textEmbeddings++;
        break;
    }
  }

  return stats;
}

/**
 * Preload embeddings for product IDs
 */
export async function preloadEmbeddings(ids: string[]): Promise<void> {
  await batchGetEmbeddings(ids);
}

/**
 * Check if embedding exists in cache
 */
export function hasEmbedding(id: string): boolean {
  const entry = memoryCache.get(id);
  return entry !== undefined && Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Get all cached product IDs
 */
export function getCachedProductIds(): string[] {
  const ids: string[] = [];
  for (const [id, entry] of memoryCache) {
    if (entry.type === 'product' && Date.now() - entry.timestamp < CACHE_TTL) {
      ids.push(id);
    }
  }
  return ids;
}

export default {
  getEmbedding,
  setEmbedding,
  batchGetEmbeddings,
  batchSetEmbeddings,
  cleanupCache,
  clearCache,
  getCacheStats,
  preloadEmbeddings,
  hasEmbedding,
  getCachedProductIds,
};
