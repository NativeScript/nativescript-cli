import { get as getConfig, set as setConfig } from './config';

export function get() {
  const config = getConfig();
  return config.appVersion;
}

export function set(appVersion) {
  const config = getConfig();
  config.appVersion = appVersion;
  setConfig(config);
  return true;
}
