import { KinveyMiddleware } from 'kinvey-javascript-sdk-core/build/rack/middleware';
const $injector = angular.injector(['ng']);

export class HttpMiddleware extends KinveyMiddleware {
  constructor() {
    super('Kinvey Angular Http Middleware');
    this.$http = $injector.get('$http');
  }

  handle(request) {
    return super.handle(request).then(() => {
      const promise = this.$http({
        url: request.url,
        method: request.method,
        headers: request.headers,
        data: request.data
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
