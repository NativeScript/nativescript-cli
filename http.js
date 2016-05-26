import { KinveyMiddleware } from 'kinvey-javascript-sdk-core/es5/rack/middleware';
const $injector = angular.injector(['ng']);

export class AngularHttpMiddleware extends KinveyMiddleware {
  constructor() {
    super('Kinvey Angular Http Middleware');
    this.$http = $injector.get('$http');
  }

  handle(request) {
    const promise = super.handle(request);
    const { url, method, headers, body } = request;

    return promise.then(() => {
      // Send the request with $http
      const promise = this.$http({
        url: url,
        method: method,
        headers: headers.toJSON(),
        data: body
      }).then(response => {
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
      return promise;
    });
  }
}
