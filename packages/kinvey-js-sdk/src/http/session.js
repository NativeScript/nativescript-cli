import isFunction from 'lodash/isFunction';
import { getConfig } from '../client';

let store = new Map();
export function use(sessionStore) {
  if (sessionStore) {
    store = sessionStore;
  }
}

export function getActiveUser() {
  const { appKey } = getConfig();
  return store.get(appKey);
}

export function setActiveUser(user) {
  const { appKey } = getConfig();

  if (!user) {
    throw new Error('Please provide a valid user to set as the active user.');
  }

  store.set(appKey, user);
  return user;
}

export function removeActiveUser() {
  const { appKey } = getConfig();

  if (isFunction(store.delete)) {
    store.delete(appKey);
  } else {
    store.remove(appKey);
  }

  return null;
}
