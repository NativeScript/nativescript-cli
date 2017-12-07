export function noop() { }

export function isPromiseLike(obj) {
  return obj && (typeof obj.then === 'function') && (typeof obj.catch === 'function');
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
