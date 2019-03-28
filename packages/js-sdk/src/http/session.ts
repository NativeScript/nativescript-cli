import { ConfigKey, getConfig } from '../config';
import { getAppKey } from '../kinvey';
import { Entity } from '../storage';

export interface SessionObject extends Entity {
  _socialIdentity?: any;
}

export interface SessionStore {
  get(key: string): SessionObject | null;
  set(key: string, session: SessionObject): boolean;
  remove(key: string): boolean;
}

function getStore() {
  return getConfig<SessionStore>(ConfigKey.SessionStore);
}

function getKey() {
  return `${getAppKey()}.active_user`;
}

export function getSession(): SessionObject | null {
  return getStore().get(getKey());
}

export function setSession(session: SessionObject): boolean {
  return getStore().set(getKey(), session);
}

export function removeSession(): boolean {
  return getStore().remove(getKey());
}
