import { Promise } from 'es6-promise';
import { Observable } from 'rxjs/Observable';
import isEmpty from 'lodash/isEmpty';

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

export function isValidStorageProviderValue(value) {
  const supportedPersistances = repositoryProvider.getSupportedStorages();
  const valueAsArray = ensureArray(value);
  return !!value && valueAsArray.length && valueAsArray.every(type => supportedPersistances.some(v => type === v));
}

export function forEachAsync(array, func) {
  let completed = 0;
  const totalCount = array.length;
  if (isEmpty(array)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onAsyncOpDone = () => {
      completed += 1;
      if (completed === totalCount) {
        resolve();
      }
    };

    array.forEach((element) => {
      func(element)
        .then(onAsyncOpDone)
        .catch(onAsyncOpDone);
    });
  });
}

export function useIfDefined(value, defaultValue) {
  if (value !== undefined) {
    return value;
  }
  return defaultValue;
}
