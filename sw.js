/* Service worker: keeps the whole site on the device so it works with no signal.
   The small app shell installs first, as one unit, so offline starts working quickly. Pictures then
   download in the background a few at a time, and a dropped download only costs that one file.
   Everything between the markers is generated. Run `node scripts/build-precache.js` to refresh it. */
/* BEGIN GENERATED */
const SHELL_VERSION = "85447257bade";
const MEDIA_VERSION = "9e796e351b2a";
const SHELL = [
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
  "index.html",
  "js/app.js",
  "js/config.js",
  "manifest.webmanifest"
];
const MEDIA = [
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
  "pages/p032.webp",
  "pages/p033.webp",
  "pages/p034.webp",
  "pages/p035.webp",
  "pages/p036.webp",
  "pages/p037.webp",
  "pages/p038.webp",
  "pages/p039.webp",
  "pages/p040.webp",
  "pages/p041.webp",
  "pages/p042.webp",
  "pages/p043.webp",
  "pages/p044.webp",
  "pages/p045.webp",
  "pages/p046.webp",
  "pages/p047.webp",
  "pages/p048.webp",
  "pages/p049.webp",
  "pages/p050.webp",
  "pages/p051.webp",
  "pages/p052.webp",
  "pages/p053.webp",
  "pages/p054.webp",
  "pages/p055.webp",
  "pages/p056.webp",
  "pages/p057.webp",
  "pages/p058.webp",
  "pages/p059.webp",
  "pages/p060.webp",
  "pages/p061.webp",
  "pages/p062.webp",
  "pages/p063.webp",
  "pages/p064.webp",
  "pages/p065.webp",
  "pages/p066.webp",
  "pages/p067.webp",
  "pages/p068.webp",
  "pages/p069.webp",
  "pages/p070.webp",
  "pages/p071.webp",
  "pages/p072.webp",
  "pages/thumbs/p032.webp",
  "pages/thumbs/p033.webp",
  "pages/thumbs/p034.webp",
  "pages/thumbs/p035.webp",
  "pages/thumbs/p036.webp",
  "pages/thumbs/p037.webp",
  "pages/thumbs/p038.webp",
  "pages/thumbs/p039.webp",
  "pages/thumbs/p040.webp",
  "pages/thumbs/p041.webp",
  "pages/thumbs/p042.webp",
  "pages/thumbs/p043.webp",
  "pages/thumbs/p044.webp",
  "pages/thumbs/p045.webp",
  "pages/thumbs/p046.webp",
  "pages/thumbs/p047.webp",
  "pages/thumbs/p048.webp",
  "pages/thumbs/p049.webp",
  "pages/thumbs/p050.webp",
  "pages/thumbs/p051.webp",
  "pages/thumbs/p052.webp",
  "pages/thumbs/p053.webp",
  "pages/thumbs/p054.webp",
  "pages/thumbs/p055.webp",
  "pages/thumbs/p056.webp",
  "pages/thumbs/p057.webp",
  "pages/thumbs/p058.webp",
  "pages/thumbs/p059.webp",
  "pages/thumbs/p060.webp",
  "pages/thumbs/p061.webp",
  "pages/thumbs/p062.webp",
  "pages/thumbs/p063.webp",
  "pages/thumbs/p064.webp",
  "pages/thumbs/p065.webp",
  "pages/thumbs/p066.webp",
  "pages/thumbs/p067.webp",
  "pages/thumbs/p068.webp",
  "pages/thumbs/p069.webp",
  "pages/thumbs/p070.webp",
  "pages/thumbs/p071.webp",
  "pages/thumbs/p072.webp",
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
const SHELL_CACHE = "theory-prep-shell-" + SHELL_VERSION;
const MEDIA_CACHE = "theory-prep-media-" + MEDIA_VERSION;
const pathOf = u => new URL(u, location.href).pathname;
const MEDIA_PATHS = new Set(MEDIA.map(pathOf));
const PARALLEL = 4;

// Downloads whichever pictures are still missing, so an interrupted run resumes where it stopped.
let filling = null;
function fillMedia(){
  if(!filling){
    filling = caches.open(MEDIA_CACHE).then(async cache => {
      const have = new Set((await cache.keys()).map(r => pathOf(r.url)));
      const todo = MEDIA.filter(u => !have.has(pathOf(u)));
      const worker = async () => {
        for(let u = todo.shift(); u; u = todo.shift()){
          try{ await cache.add(u); }catch(err){ /* the next page load tries again */ }
        }
      };
      await Promise.all(Array.from({length: PARALLEL}, worker));
    }).finally(() => { filling = null; });
  }
  return filling;
}

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  const keep = [SHELL_CACHE, MEDIA_CACHE];
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("theory-prep-") && keep.indexOf(k) < 0).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => { fillMedia(); })
  );
});

// Each page load asks for this, because the browser may stop a long download once the site is closed.
self.addEventListener("message", e => {
  if(e.data === "fill") e.waitUntil(fillMedia());
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== "GET" || url.origin !== location.origin) return;
  if(req.mode === "navigate"){
    // A page load: the app itself comes from the cache, anything else from the network (so 404.html still works online).
    e.respondWith(
      caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req)).catch(() => caches.match("index.html"))
    );
    return;
  }
  if(url.pathname.endsWith("/js/config.js")){
    // Settings: take the latest when online, so editing the file reaches phones without a rebuild.
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); if(res.ok) caches.open(SHELL_CACHE).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, {ignoreSearch: true}))
    );
    return;
  }
  e.respondWith(
    caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => {
      if(res.ok && MEDIA_PATHS.has(url.pathname)){ const copy = res.clone(); caches.open(MEDIA_CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
