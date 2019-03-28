import { SessionObject } from 'kinvey-js-sdk';

export function get(key: string): SessionObject | null {
  const session = window.localStorage.getItem(key);
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function set(key: string, session: SessionObject) {
  window.localStorage.setItem(key, JSON.stringify(session));
  return true;
}

export function remove(key: string): boolean {
  window.localStorage.removeItem(key);
  return true;
}
