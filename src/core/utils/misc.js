import { Promise } from 'es6-promise';
import { Observable } from 'rxjs/Observable';
import isEmpty from 'lodash/isEmpty';
import times from 'lodash/times';
import isNumber from 'lodash/isNumber';

import { repositoryProvider } from '../datastore';
import { PromiseQueue } from './promise-queue';
import { Query } from '../query';
import { KinveyError } from '../errors';

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

export function useIfDefined(value, defaultValue) {
  if (typeof value !== 'undefined') {
    return value;
  }
  return defaultValue;
}

export function ensureArray(obj) {
  obj = useIfDefined(obj, []);
  return Array.isArray(obj) ? obj : [obj];
}

export function isValidStorageProviderValue(value) {
  const supportedPersistances = repositoryProvider.getSupportedStorages();
  const valueAsArray = ensureArray(value);
  return !!value && valueAsArray.length && valueAsArray.every(type => supportedPersistances.some(v => type === v));
}

function _forEachAsync(array, func) {
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

export function forEachAsync(array, func, maxConcurrentCount = Infinity) {
  const queue = new PromiseQueue(maxConcurrentCount);
  return _forEachAsync(array, (item) => {
    return queue.enqueue(() => func(item));
  });
}

export function splitQueryIntoPages(query, pageSize, totalCount) {
  if (!isNumber(pageSize) || !isNumber(totalCount)) {
    throw new KinveyError('Invalid page size or expected entity count parameter');
  }

  const queryCount = Math.ceil(totalCount / pageSize);
  return times(queryCount, (i) => {
    const pageQuery = new Query(query);
    pageQuery.skip = query.skip + (i * pageSize);
    pageQuery.limit = Math.min(totalCount - (i * pageSize), pageSize);
    return pageQuery;
  });
}
