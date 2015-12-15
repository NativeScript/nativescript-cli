const Middleware = require('./middleware');
const HttpMethod = require('../core/enums').HttpMethod;
const Promise = require('bluebird');
const http = require('request');
const isEmpty = require('lodash/lang/isEmpty');
const isString = require('lodash/lang/isString');

class Http extends Middleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(request) {
    return super.handle(request).then(() => {
      const options = {
        url: request.url,
        method: request.method,
        headers: request.headers,
        qs: request.flags || {}
      };

      if (request.query) {
        const query = request.query;
        options.qs.query = query.filter;

        if (!isEmpty(query.fields)) {
          options.qs.fields = query.fields.join(',');
        }

        if (query.limit) {
          options.qs.limit = query.limit;
        }

        if (query.skip > 0) {
          options.qs.skip = query.skip;
        }

        if (!isEmpty(query.sort)) {
          options.qs.sort = query.sort;
        }
      }

      for (const key in options.qs) {
        if (options.qs.hasOwnProperty(key)) {
          options.qs[key] = isString(options.qs[key]) ? options.qs[key] : JSON.stringify(options.qs[key]);
        }
      }

      if (request.data && (request.method === HttpMethod.PATCH || request.method === HttpMethod.POST || request.method === HttpMethod.PUT)) {
        options.body = request.data;
      }

      return new Promise((resolve, reject) => {
        http(options, (err, response, body) => {
          if (err) {
            return reject(err);
          }

          request.response = {
            statusCode: response.statusCode,
            headers: response.headers,
            data: body
          };

          resolve(request);
        });
      });
    });
  }
}

module.exports = Http;
