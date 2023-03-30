
/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = 'precache-v1';
const CACHE_NAME = 'runtime_v1';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  '/'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
	console.log('install');

  console.log(PRECACHE_URLS)

  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
	console.log('activate');
  const currentCaches = [PRECACHE, CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('Serving from cache:', event.request.url);
            return response;
          } else {
            console.log('Fetching from network:', event.request.url);
            return fetch(event.request)
              .then(response => {
                const clonedResponse = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    const cacheKey = event.request.url;
                    cache.put(cacheKey, clonedResponse);
                  });
                return response;
              })
              .catch(error => {
                console.error('Failed to fetch from network:', error);
                // Fallback to a custom offline page
                return caches.match('/offline.html');
              });
          }
        })
    );
  });