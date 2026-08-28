/**
 * IndexedDB Offline Database Manager
 * Handles caching of Quranic content, favorites, and user settings
 */

const DB_NAME = 'ZikrOfflineDB';
const DB_VERSION = 4;

interface DbStore {
  name: string;
  keyPath: string;
  indexes?: Array<{ name: string; keyPath: string }>;
}

const STORES: DbStore[] = [
  {
    name: 'surahs',
    keyPath: 'id',
    indexes: [{ name: 'number', keyPath: 'number' }],
  },
  {
    name: 'ayahs',
    keyPath: 'id',
    indexes: [{ name: 'surahId', keyPath: 'surahId' }],
  },
  {
    name: 'hadith',
    keyPath: 'id',
    indexes: [{ name: 'collection', keyPath: 'collection' }],
  },
  {
    name: 'adhkar',
    keyPath: 'id',
    indexes: [{ name: 'category', keyPath: 'category' }],
  },
  {
    name: 'duas',
    keyPath: 'id',
    indexes: [{ name: 'category', keyPath: 'category' }],
  },
  { name: 'tafsir', keyPath: 'id', indexes: [{ name: 'surahId', keyPath: 'surah_id' }] },
  { name: 'hadithBooks', keyPath: 'id', indexes: [{ name: 'slug', keyPath: 'slug' }] },
  { name: 'prophets', keyPath: 'id', indexes: [{ name: 'slug', keyPath: 'slug' }] },
  { name: 'prophetSections', keyPath: 'id', indexes: [{ name: 'prophetId', keyPath: 'prophet_id' }] },
  { name: 'battles', keyPath: 'id', indexes: [{ name: 'slug', keyPath: 'slug' }] },
  { name: 'battleEvents', keyPath: 'id', indexes: [{ name: 'battleId', keyPath: 'battle_id' }] },
  { name: 'conquests', keyPath: 'id', indexes: [{ name: 'slug', keyPath: 'slug' }] },
  { name: 'conquestEvents', keyPath: 'id', indexes: [{ name: 'conquestId', keyPath: 'conquest_id' }] },
  { name: 'articles', keyPath: 'id', indexes: [{ name: 'slug', keyPath: 'slug' }] },
  { name: 'kids', keyPath: 'id', indexes: [{ name: 'slug', keyPath: 'slug' }] },
  { name: 'companions', keyPath: 'id', indexes: [{ name: 'slug', keyPath: 'slug' }] },
  { name: 'companionStories', keyPath: 'id', indexes: [{ name: 'companionId', keyPath: 'companion_id' }] },
  {
    name: 'favorites',
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'type' },
      { name: 'itemId', keyPath: 'itemId' },
    ],
  },
  {
    name: 'settings',
    keyPath: 'key',
  },
  {
    name: 'cache',
    keyPath: 'url',
    indexes: [{ name: 'timestamp', keyPath: 'timestamp' }],
  },
  {
    name: 'gameResultsQueue',
    keyPath: 'clientSubmissionId',
    indexes: [
      { name: 'nextAttemptAt', keyPath: 'nextAttemptAt' },
      { name: 'gameId', keyPath: 'gameId' },
    ],
  },
];

export class OfflineDatabase {
  private static instance: OfflineDatabase;
  private db: IDBDatabase | null = null;
  private ready = false;

  private constructor() {}

  static getInstance(): OfflineDatabase {
    if (!OfflineDatabase.instance) {
      OfflineDatabase.instance = new OfflineDatabase();
    }
    return OfflineDatabase.instance;
  }

  async initialize(): Promise<void> {
    if (this.ready) return;
    if (!('indexedDB' in window)) {
      console.warn('[OfflineDB] IndexedDB not available');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineDB] Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.ready = true;
        console.log('[OfflineDB] Database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const requestWithUpgrade = event.target as IDBOpenDBRequest;
        const db = requestWithUpgrade.result;
        const upgradeTransaction = requestWithUpgrade.transaction;

        for (const store of STORES) {
          const objectStore = db.objectStoreNames.contains(store.name)
            ? upgradeTransaction?.objectStore(store.name)
            : db.createObjectStore(store.name, { keyPath: store.keyPath });

          if (!objectStore || !store.indexes) continue;
          for (const index of store.indexes) {
            if (!objectStore.indexNames.contains(index.name)) {
              objectStore.createIndex(index.name, index.keyPath);
            }
          }
        }
      };
    });
  }

  private getStore(storeName: string, mode: 'readonly' | 'readwrite' = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async set<T>(storeName: string, data: T): Promise<T> {
    const store = this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async setMany<T>(storeName: string, rows: T[]): Promise<number> {
    if (!rows.length) return 0;
    const store = this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      let completed = 0;
      const transaction = store.transaction;
      transaction.oncomplete = () => resolve(rows.length);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
      for (const row of rows) {
        const request = store.put(row);
        request.onsuccess = () => { completed += 1; };
        request.onerror = () => reject(request.error);
      }
      void completed;
    });
  }

  async get<T>(storeName: string, key: string | number): Promise<T | undefined> {
    const store = this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async query<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    const store = this.getStore(storeName, 'readonly');
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string | number): Promise<void> {
    const store = this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const store = this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveSetting(key: string, value: any): Promise<void> {
    await this.set('settings', { key, value, timestamp: Date.now() });
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const result = await this.get<{ value: T }>('settings', key);
    return result?.value;
  }

  async saveFavorite(type: string, itemId: string, data: any): Promise<void> {
    const id = `${type}-${itemId}`;
    await this.set('favorites', {
      id,
      type,
      itemId,
      data,
      timestamp: Date.now(),
    });
  }

  async getFavorites(type?: string): Promise<any[]> {
    if (type) {
      return this.query('favorites', 'type', type);
    }
    return this.getAll('favorites');
  }

  async isFavorite(type: string, itemId: string): Promise<boolean> {
    const id = `${type}-${itemId}`;
    const result = await this.get('favorites', id);
    return !!result;
  }

  async removeFavorite(type: string, itemId: string): Promise<void> {
    const id = `${type}-${itemId}`;
    await this.delete('favorites', id);
  }

  async cacheUrl(url: string, data: any): Promise<void> {
    await this.set('cache', {
      url,
      data,
      timestamp: Date.now(),
    });
  }

  async getCachedUrl(url: string): Promise<any | undefined> {
    const result = await this.get<{ data: any }>('cache', url);
    return result?.data;
  }

  isReady(): boolean {
    return this.ready && this.db !== null;
  }
}

export const offlineDb = OfflineDatabase.getInstance();
