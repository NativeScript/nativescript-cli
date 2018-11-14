import { register as _register } from 'kinvey-http';
import httpRequest from 'request';

function http(request) {
  return new Promise((resolve, reject) => {
    httpRequest({
      headers: request.headers,
      method: request.method,
      url: request.url,
      body: request.body
    }, (error, httpResponse, data) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          statusCode: httpResponse.statusCode,
          headers: httpResponse.headers,
          data
        });
      }
    });
  });
}

export function register() {
  _register(http);
}
