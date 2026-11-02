// Service worker do Lumi: guarda os arquivos do próprio app para funcionar
// sem internet. Só lida com arquivos da mesma origem; não há chamadas externas.
const CACHE = "lumi-v1";
const CORE = ["/", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

function assetsIn(html) {
  const urls = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/[^"]+)"/g)) urls.add(m[1].replace(/&amp;/g, "&"));
  return [...urls].filter((u) => !u.startsWith("//"));
}

/** Guarda a página e todos os arquivos que ela usa; só troca a página quando tudo foi guardado. */
async function cacheShell() {
  const cache = await caches.open(CACHE);
  const res = await fetch("/", { cache: "no-store" });
  if (!res.ok) return;
  const html = await res.clone().text();
  await Promise.all(
    assetsIn(html).map((u) =>
      cache.match(u).then((hit) => hit || fetch(u).then((r) => (r.ok ? cache.put(u, r) : undefined))).catch(() => undefined),
    ),
  );
  await cache.put("/", res);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(CORE.slice(1).map((u) => cache.add(u).catch(() => undefined)));
      await cacheShell();
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-urls" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        event.data.urls
          .filter((u) => typeof u === "string" && new URL(u).origin === self.location.origin)
          .map((u) => cache.match(u).then((hit) => hit || cache.add(u)).catch(() => undefined)),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    // Abre na hora com a versão guardada e atualiza em segundo plano.
    event.respondWith(
      (async () => {
        const cached = await caches.match("/");
        const update = cacheShell().catch(() => undefined);
        if (cached) {
          event.waitUntil(update);
          return cached;
        }
        try {
          return await fetch(req);
        } catch {
          return new Response("Sem conexão. Abra o Lumi uma vez com internet para usar offline.", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req, { ignoreSearch: url.pathname.startsWith("/_next/static/") });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok && res.type === "basic") {
          const cache = await caches.open(CACHE);
          await cache.put(req, res.clone());
        }
        return res;
      } catch {
        return cached || Response.error();
      }
    })(),
  );
});
