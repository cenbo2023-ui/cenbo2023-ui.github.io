/* 岑心诚意 网站 Service Worker
 * 作用：缓存 CSS/JS/图片等静态资源，手机重复打开直接走缓存、秒开。
 * 部署后首次访问会安装并缓存；之后资源更新请把下方 CACHE 版本号 +1（如 v1→v2），
 * 旧缓存会在 activate 阶段自动清理。
 */
const CACHE = 'cenbo-site-v1';
const CORE = [
  './',
  'index.html',
  'style.css',
  'main.js',
  'videos.json',
  'DSC_7533.jpg',
  'wechat_qr.jpg',
  'hospital-hero-800.avif',
  'hospital-hero-1600.avif'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE; })
              .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

// 仅缓存同源资源；跨域（如 dwyl 访问统计）直接放行，不进缓存
function cachePut(req, res) {
  if (res && res.ok && res.type === 'basic') {
    caches.open(CACHE).then(function (c) { c.put(req, res); });
  }
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // 页面导航：网络优先，离线/失败回退到缓存首页
    e.respondWith(
      fetch(req)
        .then(function (res) { cachePut(req, res.clone()); return res; })
        .catch(function () { return caches.match('index.html'); })
    );
    return;
  }

  // 静态资源：缓存优先 + 后台静默更新（stale-while-revalidate）
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req)
        .then(function (res) { cachePut(req, res.clone()); return res; })
        .catch(function () { return cached; });
      return cached || network;
    })
  );
});
