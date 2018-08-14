export function get(appKey) {
  const session = window.localStorage.getItem(appKey);
  if (session) {
    return JSON.parse(session);
  }
  return undefined;
}

export function set(appKey, session) {
  window.localStorage.setItem(appKey, JSON.stringify(session));
  return session;
}

export function remove(appKey) {
  window.localStorage.removeItem(appKey);
  return true;
}
