import { SecureStorage } from 'nativescript-secure-storage';

const secureStorage = new SecureStorage();

export function get(key: string) {
  return secureStorage.getSync({ key });
}

export function set(key: string, session: string): boolean {
  return secureStorage.setSync({
    key,
    value: session
  });
}

export function remove(key: string): boolean {
  return secureStorage.removeSync({ key });
}
