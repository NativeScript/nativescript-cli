import { Observable } from 'rxjs/Observable';

import { repositoryProvider } from '../datastore';

export function noop() { }

export function isPromiseLike(obj) {
  return !!obj && (typeof obj.then === 'function') && (typeof obj.catch === 'function');
}

export function isObservable(obj) {
  return obj instanceof Observable;
}

export function wrapInPromise(value) {
  if (isPromiseLike(value)) {
    return value;
  }

  return Promise.resolve(value);
}

export function ensureArray(obj) {
  return Array.isArray(obj) ? obj : [obj];
}

export function isValidStorageTypeValue(value) {
  const supportedPersistances = repositoryProvider.getSupportedStorages();
  value = ensureArray(value);
  return value.length && value.every(type => supportedPersistances.some(v => type === v));
}
