export function get(key) {
  return window.localStorage.getItem(key);
}

export function set(key, session) {
  return window.localStorage.setItem(key, session);
}

export function remove(key) {
  return window.localStorage.removeItem(key);
}

