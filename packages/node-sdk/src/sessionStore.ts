const store = new Map();

export function get(key: string) {
  return store.get(key);
}

export function set(key: string, session: string) {
  store.set(key, session);
  return true;
}

export function remove(key: string): boolean {
  return store.delete(key);
}
