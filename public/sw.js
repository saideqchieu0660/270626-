const CACHE_NAME = 'henosis-root-v9';
const DYNAMIC_CACHE = 'henosis-dynamic-v9';

// 1. ASSET CACHING: Baseline assets ONLY. No dynamic Vite hashes here to prevent install aborts.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  try {
    self.skipWaiting();
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          console.log('[SW] Caching baseline App Shell...');
          await Promise.allSettled(
            STATIC_ASSETS.map(asset => 
              fetch(asset).then(async res => {
                if (res.ok) {
                  try {
                    await cache.put(asset, res);
                  } catch (e) {
                    console.warn('[SW] Cache put failed (Quota Exceeded?):', e);
                  }
                }
              }).catch(e => console.warn(`[SW] Fetch failed for ${asset}:`, e))
            )
          );
        } catch (err) {
          console.error("[SW] Cache baseline install error:", err);
        }
      })()
    );
  } catch (error) {
    console.error("[SW] Fatal install error caught:", error);
  }
});

self.addEventListener('activate', (event) => {
  try {
    event.waitUntil(
      (async () => {
        try {
          await self.clients.claim();
          const cacheNames = await caches.keys();
          await Promise.allSettled(
            cacheNames.map(async (cacheName) => {
              if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                console.log('[SW] Deleting old offline cache version:', cacheName);
                try {
                  await caches.delete(cacheName);
                } catch (e) {
                  console.warn('[SW] Failed to delete old cache:', e);
                }
              }
            })
          );
        } catch (err) {
          console.error("[SW] Activate caching error:", err);
        }
      })()
    );
  } catch (error) {
    console.error("[SW] Fatal activate error caught:", error);
  }
});

// Listener for dynamic frontend registration script (proactive cache of runtime chunks)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_ASSETS') {
    const assets = event.data.assets;
    if (Array.isArray(assets)) {
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Proactively caching active DOM assets from Vite build...');
        assets.forEach(asset => {
          cache.match(asset).then(cached => {
            if (!cached) {
               fetch(asset).then(response => {
                 if (response.ok) {
                   cache.put(asset, response);
                 }
               }).catch(e => console.warn(`[SW] Proactive cache failed for ${asset}:`, e));
             }
          });
        });
      });
    }
  }
});

self.addEventListener('fetch', (event) => {
  try {
    const url = new URL(event.request.url);

    // Bypass API requests, external Google identity services, and Firebase endpoints
    if (
      url.pathname.startsWith('/api/') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('identity') ||
      url.protocol === 'chrome-extension:' ||
      event.request.method !== 'GET'
    ) {
      return;
    }

    // 2. RESILIENT OFFLINE NAVIGATIONAL CACHING (Network-First Fallback-to-Index)
    if (event.request.mode === 'navigate') {
      event.respondWith(
        (async () => {
          try {
            const networkResponse = await fetch(event.request);
            if (!networkResponse || (!networkResponse.ok && networkResponse.type !== 'opaque')) {
              throw new Error(`Server returned non-OK status: ${networkResponse?.status}`);
            }
            try {
              const cache = await caches.open(CACHE_NAME);
              // Cache against both / and /index.html to ensure it survives SW version bumps
              await cache.put('/', networkResponse.clone());
              await cache.put('/index.html', networkResponse.clone());
            } catch (cacheErr) {
              console.warn('[SW] Cache put failed (Quota/Storage issue?):', cacheErr);
            }
            return networkResponse;
          } catch (error) {
            console.warn('[SW] Offline mode detected. SPA fallback triggered for:', url.pathname);
            try {
              let cachedResponse = await caches.match(event.request, { ignoreSearch: true })
                                || await caches.match('/', { ignoreSearch: true })
                                || await caches.match('/index.html', { ignoreSearch: true });
              
              if (!cachedResponse) {
                // Brute-force fallback: find ANY html document in the cache
                const cache = await caches.open(CACHE_NAME);
                const keys = await cache.keys();
                for (const req of keys) {
                  if (req.url.endsWith('/') || req.url.endsWith('.html')) {
                    cachedResponse = await cache.match(req);
                    if (cachedResponse) break;
                  }
                }
              }

              if (cachedResponse) return cachedResponse;
            } catch (cacheErr) {
              console.warn('[SW] Cache match failed during offline fallback:', cacheErr);
            }
            
            return new Response('Offline App Shell missing. Please connect to the internet to load the app.', { 
              status: 503, 
              statusText: 'Service Unavailable', 
              headers: { 'Content-Type': 'text/plain' }
            });
          }
        })().catch(e => {
            console.error("[SW] Fatal navigate fetch error:", e);
            return fetch(event.request);
        })
      );
      return; 
    }

    // 3. DYNAMIC ASSETS (Stale-While-Revalidate)
    event.respondWith(
      (async () => {
        let cachedResponse;
        try {
          cachedResponse = await caches.match(event.request);
        } catch (e) {
          console.warn("[SW] Dynamic cache match failed:", e);
        }

        const fetchPromise = fetch(event.request).then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            try {
               const cacheToPut = await caches.open(DYNAMIC_CACHE);
               await cacheToPut.put(event.request, networkResponse.clone());
            } catch (cachePutErr) {
               console.warn('[SW] Dynamic Cache put failed:', cachePutErr);
            }
          }
          return networkResponse;
        }).catch(() => null);

        const finalResponse = cachedResponse || await fetchPromise;
        if (!finalResponse) {
          return new Response('Offline and resource not found in cache.', { status: 503, statusText: 'Service Unavailable' });
        }
        return finalResponse;
      })().catch(e => {
        console.error("[SW] Fatal dynamic fetch error:", e);
        return fetch(event.request);
      })
    );
  } catch (err) {
    console.error("[SW] Synchronous fetch handler crash caught:", err);
  }
});

// 4. IDEMPOTENT OFFLINE/ONLINE DATA SYNC SECURITY
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-henosis-data') {
    event.waitUntil(syncOfflineData());
  }
});

function initOfflineDB_SW() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HenosisOfflineDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id' });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function validateSyncPayload(request) {
  // Protect remote DB from null/undefined corrupt overrides
  if (!request || !request.payload) return false;
  const { data } = request.payload;
  
  if (typeof data !== 'object' || data === null) return false;
  
  // Prevent destructive overrides of essential user fields
  if (data.hasOwnProperty('role') && !data.role) return false;
  if (data.hasOwnProperty('xp') && (data.xp === null || data.xp < 0)) return false;
  
  return true;
}

async function getPendingRequests_SW() {
  const db = await initOfflineDB_SW();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_sync'], 'readonly');
    const store = transaction.objectStore('pending_sync');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearPendingRequests_SW(ids) {
  if (!ids || ids.length === 0) return;
  const db = await initOfflineDB_SW();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_sync'], 'readwrite');
    const store = transaction.objectStore('pending_sync');
    ids.forEach(id => store.delete(id));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function syncOfflineData() {
  try {
    const requests = await getPendingRequests_SW();
    if (!requests || requests.length === 0) return;

    // Filter out corrupted validation fails immediately to prevent loop blockages
    const validRequests = [];
    const invalidIds = [];

    requests.forEach(req => {
      if (validateSyncPayload(req)) {
        validRequests.push(req);
      } else {
        invalidIds.push(req.id);
      }
    });

    // Clear corrupted requests so they don't block the queue
    if (invalidIds.length > 0) {
      console.warn(`[SW Background Sync] Dropping ${invalidIds.length} corrupted sync payloads.`);
      await clearPendingRequests_SW(invalidIds);
    }

    if (validRequests.length === 0) return;

    console.log(`[SW Background Sync] Khởi động đồng bộ ${validRequests.length} requests hợp lệ...`);
    
    // Safely execute API call using standard fetch
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: validRequests })
    });

    if (response.ok) {
      const data = await response.json();
      if(data.success && data.processedIds) {
          await clearPendingRequests_SW(data.processedIds);
          console.log(`[SW Background Sync] Đã đồng bộ ${data.processedIds.length} payloads lên máy chủ!`);
      } else {
          // Assume the backend manually accepted/rejected them; clear to avoid infinite sync loops
          const ids = validRequests.map(r => r.id);
          await clearPendingRequests_SW(ids);
      }
    } else {
      throw new Error(`Máy chủ từ chối lúc đồng bộ, trạng thái: ${response.status}`);
    }
  } catch (error) {
    console.error('[SW Background Sync] Thất bại mạng, sẽ tự thử lại khi có kết nối:', error);
    throw error;
  }
}

