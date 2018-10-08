import isString from 'lodash/isString';

export function serialize(contentType, body) {
  if (body && !isString(body)) {
    if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
      const str = [];
      Object.keys(body).forEach((key) => {
        str.push(`${global.encodeURIComponent(key)}=${global.encodeURIComponent(body[key])}`);
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
