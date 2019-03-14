import { SecureStorage } from 'nativescript-secure-storage';

const secureStorage = new SecureStorage();

export function get(key) {
  return secureStorage.getSync({ key });
}

export function set(key, session) {
  return secureStorage.setSync({
    key,
    value: session
  });
}

export function remove(key) {
  return secureStorage.removeSync({ key });
}

