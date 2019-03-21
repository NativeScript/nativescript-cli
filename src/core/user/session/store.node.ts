const store = new Map();

export function get(key) {
  return store.get(key);
}

export function set(key, session) {
  return store.set(key, session);
}

export function remove(key) {
  return store.delete(key);
}

