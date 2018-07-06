import cloneDeep from 'lodash/cloneDeep';
import Request from './request';

/**
 * @private
 */
export default async function serialize(request) {
  if (!request) {
    throw new Error('No request provided.');
  }

  const { headers, method, url } = request;
  const contentType = headers.get('Content-Type') || 'application/json';
  let body = cloneDeep(request.body);

  if (body && typeof body !== 'string') {
    if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
      const str = [];
      Object.keys(body).forEach((key) => {
        str.push(`${global.encodeURIComponent(key)}=${global.encodeURIComponent(body[key])}`);
      });
      body = str.join('&');
    } else if (contentType.indexOf('application/json') === 0) {
      body = JSON.stringify(body);
    }

    headers.set('Content-Type', contentType);
  }

  return new Request({
    headers,
    method,
    url,
    body
  });
}
