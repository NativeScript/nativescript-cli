import { format } from 'url';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';

function clean(value) {
  if (isPlainObject(value)) {
    return Object.keys(value).reduce((cleanVal, key) => {
      let objVal = value[key];

      if (isPlainObject(objVal)) {
        objVal = clean(objVal);
      }

      if (typeof objVal !== 'undefined' && objVal !== null) {
        cleanVal[key] = objVal;
      }

      return cleanVal;
    }, {});
  }

  return value;
}

export function formatKinveyUrl(protocol, host, pathname, query) {
  const cleanQuery = clean(query);
  return format({
    protocol,
    host,
    pathname,
    query: cleanQuery
  });
}

export function serialize(contentType, body) {
  if (body && !isString(body)) {
    if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
      const str = [];
      Object.keys(body).forEach((key) => {
        str.push(`${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`);
      });
      return str.join('&');
    } else if (contentType.indexOf('application/json') === 0) {
      return JSON.stringify(body);
    }
  }

  return body;
}

export function parse(contentType = 'application/json', data) {
  if (isString(data)) {
    if (contentType.indexOf('application/json') === 0) {
      try {
        return JSON.parse(data);
      } catch (error) {
        // TODO: log error
      }
    }
  }

  return data;
}
