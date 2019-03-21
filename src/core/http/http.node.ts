import httpRequest from 'request';

export default function http(request) {
  return new Promise((resolve, reject) => {
    httpRequest({
      headers: request.headers,
      method: request.method,
      url: request.url,
      body: request.body,
      timeout: request.timeout
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
