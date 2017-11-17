const isNull = require('lodash/isNull');
const isUndefined = require('lodash/isUndefined');

function isDefined(obj) {
  return isUndefined(obj) === false && isNull(obj) === false;
}
exports.isDefined = isDefined;

exports.isNumber = function isNumber(num) {
  return !Number.isNaN(parseFloat(num)) && Number.isFinite(num);
}

exports.nested = function nested(obj, dotProperty, value) {
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

exports.keyBy = function keyBy(array, iteratee) {
  if (!array) {
    return {};
  }

  return array.reduce((result, value) => {
    result[iteratee] = value[iteratee];
    return result;
  }, {});
}

exports.isEmpty = function isEmpty(obj) {
  // null and undefined are "empty"
  if (!isDefined(obj)) return true;

  // Assume if it has a length property with a non-zero value
  // that that property is correct.
  if (obj.length > 0) return false;
  if (obj.length === 0) return true;

  // If it isn't an object at this point
  // it is empty, but it can't be anything *but* empty
  // Is it empty?  Depends on your application.
  if (typeof obj !== 'object') return true;

  // Otherwise, does it have any properties of its own?
  // Note that this doesn't handle
  // toString and valueOf enumeration bugs in IE < 9
  return Object.keys(obj).reduce((result, key) => {
    if (!result) return false;
    if (Object.hasOwnProperty.call(obj, key)) return false;
    return true;
  }, true);
}
