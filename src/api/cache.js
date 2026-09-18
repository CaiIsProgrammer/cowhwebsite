// Session-lifetime cache for sheet reads. Google Apps Script web apps have
// real per-call latency (cold starts, a mandatory redirect hop), so without
// this every page navigation would re-fetch data that hasn't changed.
// Mutations call invalidate() so the next read is forced fresh.
const store = new Map();

export function getOrFetch(key, fetcher) {
  if (!store.has(key)) {
    const promise = fetcher().catch((err) => {
      store.delete(key);
      throw err;
    });
    store.set(key, promise);
  }
  return store.get(key);
}

export function setCached(key, value) {
  store.set(key, Promise.resolve(value));
}

export function invalidate(key) {
  store.delete(key);
}
