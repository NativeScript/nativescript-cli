import { register as _register } from 'kinvey-http';
import { request as httpRequest } from 'tns-core-modules/http';

export default async function http(request) {
  const response = await httpRequest({
    headers: request.headers,
    method: request.method,
    url: request.url,
    content: request.body
  });

  let data = response.content.raw;

  try {
    data = response.content.toString();
  } catch (e) {
    // TODO: Log error
  }

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    data
  };
}

export function register() {
  _register(http);
}
