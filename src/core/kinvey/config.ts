import KinveyError from '../errors/kinvey';

const map = new Map();
let appKey;

function getKey() {
  if (appKey) {
    return `${appKey}.config`;
  }
  return undefined;
}

export function get() {
  const key = getKey();
  if (key) {
    const config = map.get(key);
    if (config) {
      return config;
    }
  }
  throw new KinveyError('You have not initialized the Kinvey SDK.');
}

export function set(config) {
  if (config && config.appKey) {
    appKey = config.appKey;
    const key = getKey();
    map.set(key, config);
    return true;
  }
  return false;
}

export function remove() {
  const key = getKey();
  if (key) {
    map.delete(key);
    return true;
  }
  return false;
}
