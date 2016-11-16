import isNull from 'lodash/isNull';
import isUndefined from 'lodash/isUndefined';

/**
 * @private
 */
export function nested(obj, dotProperty, value) {
  if (!dotProperty) {
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
export function isDefined(obj) {
  return !isUndefined(obj) && !isNull(obj);
}
