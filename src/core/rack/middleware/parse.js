import { KinveyMiddleware } from '../middleware';

/**
 * @private
 */
export class ParseMiddleware extends KinveyMiddleware {
  constructor(name = 'Kinvey Parse Middleware') {
    super(name);
  }

  handle(request) {
    return super.handle(request).then(() => {
      const response = request.response;

      if (response && response.data) {
        const contentType = response.headers['content-type'] || response.headers['Content-Type'];

        if (contentType.indexOf('application/json') === 0) {
          try {
            response.data = JSON.parse(response.data);
          } catch (err) {
            response.data = response.data;
          }

          request.response = response;
        }
      }

      return request;
    });
  }
}
