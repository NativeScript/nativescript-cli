import { ConfigKey, getConfig } from '../config';
import { getAppKey } from '../kinvey';
import { Entity } from '../storage';

export interface SessionObject extends Entity {
  _socialIdentity?: any;
}

export interface SessionStore {
  get(key: string): string | null;
  set(key: string, session: string): boolean;
  remove(key: string): boolean;
}

function getStore() {
  return getConfig<SessionStore>(ConfigKey.SessionStore);
}

export function getKey() {
  return `${getAppKey()}.active_user`;
}

export function getSession(): SessionObject | null {
  const session = getStore().get(getKey());
  if (session) {
    return JSON.parse(session);
  }
  return null;
}

export function setSession(session: SessionObject): boolean {
  return getStore().set(getKey(), JSON.stringify(session));
}

export function removeSession(): boolean {
  return getStore().remove(getKey());
}
