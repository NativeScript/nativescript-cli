import { KinveyMiddleware } from 'kinvey-javascript-sdk-core/dist/rack';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import angular from 'angular'; // eslint-disable-line import/no-unresolved
const $injector = angular.injector(['ng']);

export class HttpMiddleware extends KinveyMiddleware {
  constructor() {
    super('Kinvey Angular Http Middleware');
  }

  async handle(request) {
    const { url, method, headers, body } = request;
    const $http = $injector.get('$http');

    try {
      // Send the request with $http
      const response = await $http({
        url: url,
        method: method,
        headers: headers,
        data: body
      });

      return {
        response: {
          statusCode: response.status,
          headers: response.headers(),
          data: response.data
        }
      };
    } catch (responseError) {
      return {
        response: {
          statusCode: responseError.status,
          headers: responseError.headers(),
          data: responseError.data
        }
      };
    }
  }
}
