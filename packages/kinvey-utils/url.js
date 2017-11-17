const url = require('url');
const qs = require('qs');
const assign = require('lodash/assign');
const isArray = require('lodash/isArray');
const isPlainObject = require('lodash/isPlainObject');
const isString = require('lodash/isString');
const isEmpty = require('lodash/isEmpty');
const { isDefined } = require('./object');

/**
 * @private
 * Adapted from https://github.com/lakenen/node-append-query, to fit a non-node runtime.
 */
function serialize(obj, options = {}, prefix) {
  const str = [];
  let useArraySyntax = false;

  if (isArray(obj) && isDefined(prefix)) {
    useArraySyntax = true;
  }

  Object.keys(obj).forEach((prop) => {
    let query;
    const val = obj[prop];

    const key = prefix ?
      `${prefix}[${useArraySyntax ? '' : prop}]` :
      prop;

    if (isDefined(val) === false) {
      if (options.removeNull === true) {
        return;
      }

      query = options.encodeComponents === true ? encodeURIComponent(key) : key;
    } else if (isPlainObject(val)) {
      query = serialize(val, options, key);
    } else {
      query = options.encodeComponents ?
        `${encodeURIComponent(key)}=${encodeURIComponent(val)}` :
        `${key}=${val}`;
    }

    str.push(query);
  });

  return str.join('&');
}

/**
 * @private
 */
exports.appendQuery = function appendQuery(uri, query, options = {}) {
  const parts = url.parse(uri, true);
  const queryToAppend = isString(query) ? qs.parse(query) : query;
  const parsedQuery = assign({}, parts.query, queryToAppend);
  options = assign({ encodeComponents: true, removeNull: false }, options);
  parts.query = null;
  const queryString = serialize(parsedQuery, options);
  parts.search = isDefined(queryString) && isEmpty(queryString) === false ? `?${queryString}` : null;
  return url.format(parts);
}
