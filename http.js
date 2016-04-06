import { KinveyMiddleware } from 'kinvey-javascript-sdk-core/build/rack/middleware';
import parseHeaders from 'parse-headers';

export class HttpMiddleware extends KinveyMiddleware {
  constructor(name = 'Kinvey PhoneGap Http Middleware') {
    super(name);
  }

  handle(request) {
    return super.handle(request).then(() => {
      const promise = new Promise((resolve, reject) => {
        // Create request
        const xhr = new XMLHttpRequest();
        xhr.open(request.method, request.url);
        xhr.responseType = request.responseType;

        // Append request headers
        for (const name in request.headers) {
          if (request.headers.hasOwnProperty(name)) {
            request.setRequestHeader(name, request.headers[name]);
          }
        }

        xhr.onload = xhr.ontimeout = xhr.onabort = xhr.onerror = () => {
          // Extract status code
          const statusCode = xhr.status;

          // Extract the response
          let responseData = xhr.response || null;
          if (xhr.response) {
            responseData = xhr.responseText || null;
          }

          // Set the response for the request
          request.response = {
            statusCode: statusCode,
            headers: parseHeaders(xhr.getAllResponseHeaders()),
            data: responseData
          };

          // Success
          if ((statusCode >= 200 && statusCode < 300) || statusCode === 304) {
            return resolve(request);
          }

          // Error
          return reject(request);
        };
      });
      return promise;
    });
  }
}
