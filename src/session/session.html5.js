import { getKey } from './utils';

export function get() {
  const key = getKey();
  const session = window.localStorage.getItem(key);
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function set(session) {
  const key = getKey();
  window.localStorage.setItem(key, JSON.stringify(session));
  return true;
}

export function remove() {
  const key = getKey();
  window.localStorage.removeItem(key);
  return true;
}

