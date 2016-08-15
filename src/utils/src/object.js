import forEach from 'lodash/forEach';
import isFunction from 'lodash/isFunction';

/**
 * @private
 */
export function nested(obj, dotProperty, value) {
  if (!dotProperty) {
    obj = !!value ? value : obj;
    return obj;
  }

  const parts = dotProperty.split('.');
  let current = parts.shift();
  while (current && obj) {
    obj = obj[current];
    current = parts.shift();
  }

  return !!value ? value : obj;
}

/**
 * @private
 */
export function isDefined(obj) {
  return obj !== undefined && obj !== null;
}

/**
 * @private
 */
export function use(nsInterface) {
  return function(adapter = {}) {
    forEach(nsInterface, methodName => {
      if (isFunction(adapter[methodName])) {
        this.prototype[methodName] = function(...args) {
          return adapter[methodName].apply(this, args);
        };
      }
    });
  };
}
