import { KinveyMiddleware } from './core/rack/middleware';
import { HttpMethod } from './core/enums';
import result from 'lodash/result';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

/**
 * @private
 */
export class ngHttpMiddleware extends KinveyMiddleware {
  constructor($http) {
    super('Kinvey Angular Http Middleware');
    this.$http = $http;
  }

  handle(request) {
    return super.handle(request).then(() => {
      const options = {
        url: request.url,
        method: request.method,
        headers: request.headers,
        params: request.flags || {}
      };

      if (request.query) {
        const query = result(request.query, 'toJSON', request.query);
        options.params.query = query.filter;

        if (!isEmpty(query.fields)) {
          options.params.fields = query.fields.join(',');
        }

        if (query.limit) {
          options.params.limit = query.limit;
        }

        if (query.skip > 0) {
          options.params.skip = query.skip;
        }

        if (!isEmpty(query.sort)) {
          options.params.sort = query.sort;
        }
      }

      for (const key in options.params) {
        if (options.params.hasOwnProperty(key)) {
          options.params[key] = isString(options.params[key]) ?
                                options.params[key] : JSON.stringify(options.params[key]);
        }
      }

      if (request.data && (request.method === HttpMethod.PATCH ||
                           request.method === HttpMethod.POST ||
                           request.method === HttpMethod.PUT)) {
        options.data = request.data;
      }

      return this.$http(options).then(response => {
        request.response = {
          statusCode: response.status,
          headers: response.headers(),
          data: response.data
        };

        return request;
      }).catch(response => {
        request.response = {
          statusCode: response.status,
          headers: response.headers(),
          data: response.data
        };

        return request;
      });
    });
  }
}
