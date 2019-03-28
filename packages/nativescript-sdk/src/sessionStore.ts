import { SessionObject } from 'kinvey-js-sdk';
import { SecureStorage } from 'nativescript-secure-storage';

const secureStorage = new SecureStorage();

export function get(key: string): SessionObject | null {
  const session = secureStorage.getSync({ key });
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function set(key: string, session: SessionObject): boolean {
  return secureStorage.setSync({
    key,
    value: JSON.stringify(session)
  });
}

export function remove(key: string): boolean {
  return secureStorage.removeSync({ key });
}
