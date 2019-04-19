import { SecureStorage } from 'nativescript-secure-storage';

export function get(key: string) {
  const secureStorage = new SecureStorage();
  return secureStorage.getSync({ key });
}

export function set(key: string, session: string): boolean {
  const secureStorage = new SecureStorage();
  return secureStorage.setSync({
    key,
    value: session
  });
}

export function remove(key: string): boolean {
  const secureStorage = new SecureStorage();
  return secureStorage.removeSync({ key });
}
