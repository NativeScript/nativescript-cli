import Promise from 'core-js/es6/promise';
import http from 'http';
import https from 'https';
import url from 'url';

export default class NodeHttp {
  handle(request) {
    const promise = new Promise((resolve, reject) => {
      const { method, headers, body } = request;
      const path = url.parse(request.url);
      const adapter = path.protocol === 'https:' ? https : http;

      // Set the Content-Length header if it doesn't already exist
      if (body && !headers['content-length'] && !headers['Content-Length']) {
        let length = 0;

        // Get the length of the body
        if (body instanceof Buffer) {
          length = body.length;
        } else if (body) {
          length = Buffer.byteLength(body);
        }

        // Set the Content-Length header
        headers['Content-Length'] = length;
      }

      const httpRequest = adapter.request({
        host: path.hostname,
        path: path.pathname + (path.search ? path.search : ''),
        port: path.port,
        method: method,
        headers: headers
      }, (response) => {
        const data = [];

        // Listen for data
        response.on('data', (chunk) => {
          data.push(new Buffer(chunk));
        });

        // Listen for request completion
        response.on('end', () => {
          resolve({
            response: {
              statusCode: response.statusCode,
              headers: response.headers,
              data: Buffer.concat(data)
            }
          });
        });
      });

      // Listen fro request errors
      httpRequest.on('error', (error) => {
        reject(error);
      });

      // Write the body
      if (body) {
        httpRequest.write(body);
      }

      // Initiate request
      httpRequest.end();
    });
    return promise;
  }

  static isSupported() {
    return typeof exports === 'object' && typeof window === 'undefined';
  }
}
