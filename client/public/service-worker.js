const CACHE_PREFIX = 'planeforge';

const clearPlaneForgeCaches = async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)));
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(clearPlaneForgeCaches());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clearPlaneForgeCaches().then(() => {
      self.registration.unregister();
      return self.clients.claim();
    })
  );
});
