import { KinveyMiddleware } from '../middleware';
import { HttpMethod } from '../../enums';
import { NetworkConnectionError } from '../../errors';
import http from 'request';
import result from 'lodash/result';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

/**
 * @private
 */
export class HttpMiddleware extends KinveyMiddleware {
  constructor() {
    super('Kinvey Http Middleware');
  }

  handle(request) {
    return super.handle(request).then(() => {
      const options = {
        url: request.url,
        method: request.method,
        headers: request.headers,
        qs: {},
        followRedirect: request.followRedirect
      };

      if (request.query) {
        const query = result(request.query, 'toJSON', request.query);
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

      if (request.data && (request.method === HttpMethod.PATCH ||
                           request.method === HttpMethod.POST ||
                           request.method === HttpMethod.PUT)) {
        options.body = request.data;
      }

      return new Promise((resolve, reject) => {
        http(options, (err, response, body) => {
          if (err) {
            if (err.code === 'ENOTFOUND') {
              return reject(new NetworkConnectionError('It looks like you do not have a network connection. ' +
                'Please check that you are connected to a network and try again.'));
            }

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
