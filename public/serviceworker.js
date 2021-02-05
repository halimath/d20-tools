const CacheVersion = 5;
const CacheName = `d20-tools-cache-v${CacheVersion}`;

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CacheName)
        .then(cache => {
            return cache.addAll([
                "/index.html",
                "/grid.html",
                "/manifest.json",
                "/icon.png",
                "/serviceworker.js",
                "/diceroller.js",
                "/grid.js",
            ]);
        })
    );
});