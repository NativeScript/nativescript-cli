import { KinveyMiddleware } from 'kinvey-javascript-sdk-core/dist/rack/middleware';
const $injector = angular.injector(['ng']);

export class HttpMiddleware extends KinveyMiddleware {
  constructor() {
    super('Kinvey Angular Http Middleware');
    this.$http = $injector.get('$http');
  }

  async handle(request) {
    await super.handle(request);
    const { url, method, headers, body } = request;

    try {
      // Send the request with $http
      const response = await this.$http({
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
