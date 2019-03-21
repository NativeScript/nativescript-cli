import { get as getConfig } from '../../kinvey/config';
import * as store from './store';

function getKey() {
  const { appKey } = getConfig();
  return `${appKey}.active_user`;
}

export function get() {
  const key = getKey();
  const session = store.get(key);
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function set(session) {
  const key = getKey();
  store.set(key, JSON.stringify(session));
  return true;
}

export function remove() {
  const key = getKey();
  store.remove(key);
  return true;
}
