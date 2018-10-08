import isFunction from 'lodash/isFunction';
import { getConfig } from 'kinvey-app';

const KEY = 'active_user';

let store = new Map();
export function register(sessionStore) {
  if (sessionStore) {
    store = sessionStore;
  }
}

export function get() {
  const { appKey } = getConfig();
  return store.get(`${appKey}.${KEY}`);
}

export function set(session) {
  const { appKey } = getConfig();

  if (session) {
    store.set(`${appKey}.${KEY}`, session);
  }

  return session;
}

export function remove() {
  const { appKey } = getConfig();

  if (isFunction(store.delete)) {
    store.delete(`${appKey}.${KEY}`);
  } else {
    store.remove(`${appKey}.${KEY}`);
  }

  return null;
}
