const config = new Map();

export enum ConfigKey {
  KinveyConfig,
  HttpAdapter,
  SessionStore,
  StorageAdapter,
  Popup,
  PubNub
}

export function getConfig<T>(key: ConfigKey) {
  return config.get(key) as T;
}

export function setConfig(key: ConfigKey, value: any) {
  return config.set(key, value);
}
