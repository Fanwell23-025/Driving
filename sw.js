/* Service worker: keeps the whole site on the device so it works with no signal.
   VERSION and PRECACHE are generated. Run `node scripts/build-precache.js` to refresh them. */
/* BEGIN GENERATED */
const VERSION = "a0c9663e45d7";
const PRECACHE = [
  "./",
  "404.html",
  "css/style.css",
  "data/data.json",
  "fonts/barlow-400.woff2",
  "fonts/barlow-500.woff2",
  "fonts/barlow-600.woff2",
  "fonts/barlow-condensed-600.woff2",
  "fonts/barlow-condensed-700.woff2",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "img/T1_q19.jpeg",
  "img/T1_q21.jpeg",
  "img/T1_q22.jpeg",
  "img/T1_q23.jpeg",
  "img/T1_q24.jpeg",
  "img/T1_q26.jpeg",
  "img/T1_q27.jpeg",
  "img/T2_q10.jpeg",
  "img/T2_q15.jpeg",
  "img/T2_q16.jpeg",
  "img/T2_q18.jpeg",
  "img/T2_q20.jpeg",
  "img/T2_q21.jpeg",
  "img/T2_q22.jpeg",
  "img/T2_q23.jpeg",
  "img/T2_q24.jpeg",
  "img/T2_q25.jpeg",
  "img/T2_q4.jpeg",
  "img/T2_q5.jpeg",
  "img/T2_q6.jpeg",
  "img/T2_q7.jpeg",
  "img/T2_q9.jpeg",
  "img/T3_q13.jpeg",
  "img/T3_q15.jpeg",
  "img/T3_q16.jpeg",
  "img/T3_q18.jpeg",
  "img/T3_q19.jpeg",
  "img/T3_q20.jpeg",
  "img/T3_q22.jpeg",
  "img/T3_q23.jpeg",
  "img/T3_q26.jpeg",
  "img/T4_q11.jpeg",
  "img/T4_q14.jpeg",
  "img/T4_q15.jpeg",
  "img/T4_q17.jpeg",
  "img/T4_q18.jpeg",
  "img/T4_q21.jpeg",
  "img/T4_q23.jpeg",
  "img/T4_q24.jpeg",
  "img/T4_q25.jpeg",
  "img/T4_q26.jpeg",
  "img/T4_q29.jpeg",
  "img/T4_q5.jpeg",
  "img/T4_q7.jpeg",
  "img/T4_q8.jpeg",
  "img/T4_q9.jpeg",
  "img/pk_q5.jpg",
  "img/sp_q12.jpg",
  "img/sp_q13.jpg",
  "img/sp_q2.jpg",
  "img/sp_q3.jpg",
  "index.html",
  "js/app.js",
  "manifest.webmanifest",
  "pages/p032.jpg",
  "pages/p033.jpg",
  "pages/p034.jpg",
  "pages/p035.jpg",
  "pages/p036.jpg",
  "pages/p037.jpg",
  "pages/p038.jpg",
  "pages/p039.jpg",
  "pages/p040.jpg",
  "pages/p041.jpg",
  "pages/p042.jpg",
  "pages/p043.jpg",
  "pages/p044.jpg",
  "pages/p045.jpg",
  "pages/p046.jpg",
  "pages/p047.jpg",
  "pages/p048.jpg",
  "pages/p049.jpg",
  "pages/p050.jpg",
  "pages/p051.jpg",
  "pages/p052.jpg",
  "pages/p053.jpg",
  "pages/p054.jpg",
  "pages/p055.jpg",
  "pages/p056.jpg",
  "pages/p057.jpg",
  "pages/p058.jpg",
  "pages/p059.jpg",
  "pages/p060.jpg",
  "pages/p061.jpg",
  "pages/p062.jpg",
  "pages/p063.jpg",
  "pages/p064.jpg",
  "pages/p065.jpg",
  "pages/p066.jpg",
  "pages/p067.jpg",
  "pages/p068.jpg",
  "pages/p069.jpg",
  "pages/p070.jpg",
  "pages/p071.jpg",
  "pages/p072.jpg",
  "signs/s00.png",
  "signs/s01.png",
  "signs/s02.png",
  "signs/s03.png",
  "signs/s04.png",
  "signs/s05.png",
  "signs/s06.png",
  "signs/s07.png",
  "signs/s08.png",
  "signs/s09.png",
  "signs/s10.png",
  "signs/s11.png",
  "signs/s12.png",
  "signs/s13.png",
  "signs/s14.png",
  "signs/s15.png",
  "signs/s16.png",
  "signs/s17.png",
  "signs/s18.png",
  "signs/s19.png",
  "signs/s20.png",
  "signs/s21.png",
  "signs/s22.png",
  "signs/s23.png",
  "signs/s24.png",
  "signs/s25.png",
  "signs/s26.png",
  "signs/s27.png",
  "signs/s28.png"
];
/* END GENERATED */
const CACHE = "theory-prep-" + VERSION;

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE.map(u => new Request(u, {cache: "reload"}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("theory-prep-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if(req.mode === "navigate"){
    // A page load: the app itself comes from the cache, anything else from the network (so 404.html still works online).
    e.respondWith(
      caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req)).catch(() => caches.match("index.html"))
    );
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req)));
});
