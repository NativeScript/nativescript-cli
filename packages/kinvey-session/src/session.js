import isFunction from 'lodash/isFunction';
import { getConfig } from 'kinvey-app';

const TAG = 'session';

let store = new Map();
export function register(sessionStore) {
  if (sessionStore) {
    store = sessionStore;
  }
}

export function get() {
  const { appKey } = getConfig();
  return store.get(`${appKey}${TAG}`);
}

export function set(session) {
  const { appKey } = getConfig();

  if (session) {
    store.set(`${appKey}${TAG}`, session);
  }

  return session;
}

export function remove() {
  const { appKey } = getConfig();

  if (isFunction(store.delete)) {
    store.delete(`${appKey}${TAG}`);
  } else {
    store.remove(`${appKey}${TAG}`);
  }

  return null;
}
