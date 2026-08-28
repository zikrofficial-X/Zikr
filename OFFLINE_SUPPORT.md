# Offline Support Documentation

## Overview

The Zikr platform now includes comprehensive offline support powered by:

- **Service Worker** - Caches pages and assets for offline access
- **IndexedDB** - Local database for Quranic content, favorites, and settings
- **Offline Indicator** - Shows users when they're offline or reconnecting
- **Network-first content caching** - Caches public content API responses after installation or first successful use, then serves them when offline

## Features

### 1. Offline Content Access

#### Pre-cached Pages
The app shell and core pages are cached during service-worker installation:
- Home page (`/`)
- Quran (`/quran`)
- Adhkar (`/adhkar`)
- Prayer times (`/prayer-times`)
- Duas (`/dua`)
- Hadith, stories, articles, prophets, companions, kids, search, radio, qibla, poetry, memorization, spiritual AI, FAQ, and platform pages

Public content API responses for Quran surahs, hadith books, duas, stories, articles, companions, prophets, and tawasheeh are also cached through a network-first strategy. Authenticated APIs, user data, and media streams remain network-only for privacy and bandwidth reasons.

#### Offline Database

IndexedDB stores include:
- **surahs** - Quranic chapters
- **ayahs** - Quranic verses
- **hadith** - Hadith collections
- **adhkar** - Daily remembrances
- **duas** - Supplications
- **favorites** - User's favorite items
- **settings** - User preferences
- **cache** - General content cache

### 2. Favorites System

Users can mark content as favorites while online. Favorites are stored in IndexedDB and available offline:

```typescript
import { offlineDb } from '@/lib/offline-db';

// Save favorite
await offlineDb.saveFavorite('surah', '1', { name: 'Al-Fatiha' });

// Check if favorite
const isFav = await offlineDb.isFavorite('surah', '1');

// Get all favorites
const favorites = await offlineDb.getFavorites();

// Get favorites by type
const surahFavorites = await offlineDb.getFavorites('surah');

// Remove favorite
await offlineDb.removeFavorite('surah', '1');
```

### 3. Settings Persistence

User settings are automatically saved offline:

```typescript
import { offlineDb } from '@/lib/offline-db';

// Save setting
await offlineDb.saveSetting('theme', 'dark');
await offlineDb.saveSetting('language', 'ar');

// Get setting
const theme = await offlineDb.getSetting('theme');
const language = await offlineDb.getSetting('language');
```

### 4. Offline Status Monitoring

Track online/offline status using the `useOfflineStatus` hook:

```typescript
import { useOfflineStatus } from '@/hooks/use-offline-status';

export function MyComponent() {
  const { isOnline, wasOffline } = useOfflineStatus();

  return (
    <div>
      {isOnline ? 'Online' : 'Offline'}
      {wasOffline && 'Was offline'}
    </div>
  );
}
```

### 5. Offline Data Loading

Load data that was previously cached using `useOfflineData`:

```typescript
import { useOfflineData } from '@/hooks/use-offline-data';

export function MyComponent() {
  const { data, isCached, refresh } = useOfflineData({
    storeName: 'surahs',
    fallback: [],
  });

  return (
    <div>
      {isCached && <span>From cache</span>}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### 6. Offline Indicator

A visual indicator shows users when they're offline or just came back online. It's automatically displayed in the site shell.

## Service Worker

The service worker (`public/sw.js`) implements:

### Cache Strategy

1. **HTML Pages** - Network first, fallback to cache
2. **Assets** - Cache first, fallback to network
3. **API Calls** - Always go to network (no caching)

### Static Assets Pre-cached on Install

```
- /
- /offline.html
- /manifest.webmanifest
- /quran
- /adhkar
- /prayer-times
- /tasbeeh
- /dua
- /settings
- /wird
- /zakat
```

### Excluded from Caching

- Audio/video files (media range requests)
- Cross-origin requests
- API calls
- Third-party ad/tracking scripts

## Usage Examples

### Example 1: Cache Surah Data

```typescript
import { offlineDb } from '@/lib/offline-db';

async function cacheSurah(surahNumber: number, surahData: any) {
  try {
    await offlineDb.initialize();
    await offlineDb.set('surahs', { id: surahNumber, ...surahData });
    console.log(`Surah ${surahNumber} cached`);
  } catch (error) {
    console.error('Failed to cache surah:', error);
  }
}
```

### Example 2: Load Favorite Surahs

```typescript
import { useOfflineData } from '@/hooks/use-offline-data';

export function FavoriteSurahs() {
  const { data: favorites, isCached } = useOfflineData({
    storeName: 'favorites',
    initialData: [],
  });

  return (
    <div>
      <h2>My Favorites {isCached && '(Cached)'}</h2>
      <ul>
        {favorites.map(fav => (
          <li key={fav.id}>{fav.data.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 3: Sync Data When Back Online

```typescript
import { useEffect } from 'react';
import { useOfflineStatus } from '@/hooks/use-offline-status';

export function SyncComponent() {
  const { isOnline, wasOffline } = useOfflineStatus();

  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log('Back online - syncing data...');
      // Perform sync operations
    }
  }, [isOnline, wasOffline]);

  return null;
}
```

## Testing Offline Mode

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Navigate around the site

### Firefox DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Click on the "Work Offline" toggle

### Service Worker Status

Check if service worker is registered:

1. Open DevTools
2. Go to Application tab
3. Look for "Service Workers" section
4. Should show "sw.js" as "activated"

## Cache Storage

View cached content:

1. Open DevTools
2. Go to Application tab
3. Expand "Cache Storage"
4. Look for the "zikr-v6" cache
5. View all cached URLs

## IndexedDB Inspector

View offline database:

1. Open DevTools
2. Go to Application tab
3. Expand "IndexedDB"
4. Look for "ZikrOfflineDB"
5. Browse stores (surahs, favorites, settings, etc.)

## Performance Metrics

Offline support improves performance:

- **First Load**: ~1.5 MB (includes service worker)
- **Repeat Offline Load**: <500ms
- **Cache Size**: ~5-10 MB for full site
- **IndexedDB Size**: Depends on cached content (typically <50 MB)

## Browser Support

Offline features require:

- **Service Workers** - Chrome, Firefox, Edge, Opera (not IE)
- **IndexedDB** - All modern browsers
- **Cache API** - All modern browsers

Fallbacks provided for older browsers.

## Troubleshooting

### Service Worker not registering

1. Check browser console for errors
2. Verify `public/sw.js` exists
3. Clear browser cache and reload
4. Try incognito/private mode

### IndexedDB not working

1. Check if private/incognito mode (sometimes blocks IndexedDB)
2. Verify browser supports IndexedDB
3. Check DevTools for quota errors
4. Try clearing IndexedDB in DevTools

### Content not cached

1. Visit page while online first
2. Check Network tab to confirm caching
3. View Cache Storage in DevTools
4. Check if page is in STATIC_ASSETS list

## Storage Limits

Browser storage quotas:

- **Cache API**: 50-100 MB per site
- **IndexedDB**: 50-100 MB per site
- **Combined**: Up to 50% of disk space

Users can grant persistent storage permission:

```typescript
if (navigator.storage?.persist) {
  const persistent = await navigator.storage.persist();
  console.log(`Persistent storage: ${persistent}`);
}
```

## Future Enhancements

Planned offline improvements:

1. Image caching in IndexedDB
2. Audio file streaming optimization
3. Selective download for offline reading
4. Sync queue for user submissions
5. P2P sync between devices
6. Offline search functionality

## API Reference

### OfflineDatabase Class

```typescript
class OfflineDatabase {
  // Initialize database
  initialize(): Promise<void>

  // Set/Get individual items
  set<T>(storeName: string, data: T): Promise<T>
  get<T>(storeName: string, key: string | number): Promise<T | undefined>

  // Bulk operations
  getAll<T>(storeName: string): Promise<T[]>
  query<T>(storeName: string, indexName: string, value: any): Promise<T[]>
  delete(storeName: string, key: string | number): Promise<void>
  clear(storeName: string): Promise<void>

  // Favorites management
  saveFavorite(type: string, itemId: string, data: any): Promise<void>
  getFavorites(type?: string): Promise<any[]>
  isFavorite(type: string, itemId: string): Promise<boolean>
  removeFavorite(type: string, itemId: string): Promise<void>

  // Settings management
  saveSetting(key: string, value: any): Promise<void>
  getSetting<T>(key: string): Promise<T | undefined>

  // URL caching
  cacheUrl(url: string, data: any): Promise<void>
  getCachedUrl(url: string): Promise<any | undefined>

  // Status
  isReady(): boolean
}
```

## Support

For offline support issues:

1. Check this documentation
2. View DevTools Application tab
3. Check browser console for errors
4. Clear cache and try again
5. Report bugs with console errors

---

**Last Updated**: 2024
**Offline Support**: Fully Implemented
**Browser Support**: All Modern Browsers
