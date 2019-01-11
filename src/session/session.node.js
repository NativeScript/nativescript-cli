import { getKey } from './utils';

const STORE = new Map();

export function get() {
  const key = getKey();
  return STORE.get(key);
}

export function set(session) {
  const key = getKey();
  STORE.set(key, session);
  return true;
}

export function remove() {
  const key = getKey();
  STORE.delete(key);
  return true;
}

