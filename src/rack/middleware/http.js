const Middleware = require('./middleware');
const HttpMethod = require('../../core/enums/httpMethod');
const KinveyError = require('../../core/errors').KinveyError;
const Promise = require('bluebird');
const http = require('http');
const https = require('https');
const url = require('url');
const isString = require('lodash/lang/isString');
const merge = require('lodash/object/merge');

class Http extends Middleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(request) {
    return super.handle(request).then(() => {
      let adapter = http;

      if (url.parse(request.url).protocol === 'https:') {
        adapter = https;
      }

      return new Promise((resolve, reject) => {
        let data = request.data;
        let length = 0;

        if (data instanceof Buffer) {
          length = data.length;
        } else if (data) {
          if (!isString(data)) {
            data = String(data);
          }

          length = Buffer.byteLength(data);
        }

        request.headers['content-length'] = length;

        const httpRequest = adapter.request({
          method: request.method,
          hostname: url.parse(request.url).hostname,
          headers: request.headers,
          path: url.format({
            pathname: request.path,
            query: merge({}, request.query, request.flags),
          })
        });

        httpRequest.on('response', (res) => {
          const data = [];

          res.on('data', chunk => {
            data.push(new Buffer(chunk));
          });

          res.on('end', () => {
            request.response = {
              statusCode: res.statusCode,
              headers: res.headers,
              data: Buffer.concat(data)
            };

            resolve(request);
          });
        });

        httpRequest.on('error', (err) => {
          reject(err);
        });

        if (request.data &&
          (request.method === HttpMethod.POST
            || request.method === HttpMethod.PATCH
            || request.method === HttpMethod.PUT)) {
          httpRequest.write(request.data);
        }

        if (request.timeout) {
          httpRequest.setTimeout(request.timeout, () => {
            reject(new KinveyError('Http request timed out.'));
          });
        }

        httpRequest.end();
      });
    });
  }
}

module.exports = Http;
