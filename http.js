import { KinveyMiddleware } from 'kinvey-javascript-sdk-core/dist/rack/middleware';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
import angular from 'angular'; // eslint-disable-line import/no-unresolved
const $injector = angular.injector(['ng']);

export class HttpMiddleware extends KinveyMiddleware {
  constructor() {
    super('Kinvey Angular Http Middleware');
  }

  async handle(request) {
    await super.handle(request);
    const { url, method, headers, body } = request;
    const $http = $injector.get('$http');

    try {
      // Send the request with $http
      const response = await $http({
        url: url,
        method: method,
        headers: headers.toJSON(),
        data: body
      });

      request.response = {
        statusCode: response.status,
        headers: response.headers(),
        data: response.data
      };

      return request;
    } catch (responseError) {
      request.response = {
        statusCode: responseError.status,
        headers: responseError.headers(),
        data: responseError.data
      };

      return request;
    }
  }
}
