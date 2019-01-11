import { SecureStorage } from 'nativescript-secure-storage';
import { getKey } from './utils';

const secureStorage = new SecureStorage();

export function get() {
  const key = getKey();
  const session = secureStorage.getSync({ key });
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function set(session) {
  const key = getKey();
  return secureStorage.setSync({
    key,
    value: JSON.stringify(session)
  });
}

export function remove() {
  const key = getKey();
  return secureStorage.removeSync({ key });
}

