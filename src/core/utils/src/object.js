import isNull from 'lodash/isNull';
import isUndefined from 'lodash/isUndefined';

/**
 * @private
 */
export function isDefined(obj) {
  return isUndefined(obj) === false && isNull(obj) === false;
}

/**
 * @private
 */
export function nested(obj, dotProperty, value) {
  if (isDefined(dotProperty) === false) {
    obj = value || obj;
    return obj;
  }

  const parts = dotProperty.split('.');
  let current = parts.shift();
  while (current && obj) {
    obj = obj[current];
    current = parts.shift();
  }

  return value || obj;
}


/**
 * @private
 */
export function keyBy(array, iteratee) {
  return array.reduce((result, value) => {
    result[iteratee] = value[iteratee];
    return result;
  }, {});
}
