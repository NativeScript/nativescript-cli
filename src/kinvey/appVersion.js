import { get as getConfig, set as setConfig } from './config';

/**
 * The version of your app. It will sent with Kinvey API requests
 * using the X-Kinvey-Api-Version header.
 *
 * @return {string} The version of your app.
 */
export function get() {
  const config = getConfig();
  return config.appVersion;
}

/**
 * Set the version of your app. It will sent with Kinvey API requests
 * using the X-Kinvey-Api-Version header.
 *
 * @param  {string} appVersion  App version.
 */
export function set(appVersion) {
  const config = getConfig();
  config.appVersion = appVersion;
  setConfig(config);
  return true;
}
