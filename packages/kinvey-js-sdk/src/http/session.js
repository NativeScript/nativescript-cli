import isFunction from 'lodash/isFunction';
import { getConfig } from '../client';

const TAG = 'session';

let store = new Map();
export function use(sessionStore) {
  if (sessionStore) {
    store = sessionStore;
  }
}

export function getSession() {
  const { appKey } = getConfig();
  return store.get(`${appKey}${TAG}`);
}

export function setSession(session) {
  const { appKey } = getConfig();

  if (session) {
    store.set(`${appKey}${TAG}`, session);
  }

  return session;
}

export function removeSession() {
  const { appKey } = getConfig();

  if (isFunction(store.delete)) {
    store.delete(`${appKey}${TAG}`);
  } else {
    store.remove(`${appKey}${TAG}`);
  }

  return null;
}
