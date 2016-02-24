import clone from 'lodash/clone';

/**
 * @private
 */
export function nested(obj, dotProperty, value) {
  obj = clone(obj, true);

  if (!dotProperty) {
    obj = value ? value : obj;
    return obj;
  }

  const parts = dotProperty.split('.');
  let current = parts.shift();
  while (current && obj) {
    obj = obj[current];
    current = parts.shift();
  }

  return value ? value : obj;
}

/**
 * @private
 */
export function isDefined(obj) {
  return obj !== undefined && obj !== null;
}
