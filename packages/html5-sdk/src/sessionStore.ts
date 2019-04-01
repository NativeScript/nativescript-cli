export function get(key: string) {
  return window.localStorage.getItem(key);
}

export function set(key: string, session: string) {
  window.localStorage.setItem(key, session);
  return true;
}

export function remove(key: string): boolean {
  window.localStorage.removeItem(key);
  return true;
}
