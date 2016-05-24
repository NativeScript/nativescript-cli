import { KinveyMiddleware } from '../middleware';

/**
 * @private
 */
export class ParseMiddleware extends KinveyMiddleware {
  constructor(name = 'Kinvey Parse Middleware') {
    super(name);
  }

  async handle(request) {
    request = await super.handle(request);
    const response = request.response;

    if (response && response.data) {
      const contentType = response.headers['content-type'] || response.headers['Content-Type'];

      if (contentType) {
        if (contentType.indexOf('application/json') === 0) {
          try {
            response.data = JSON.parse(response.data);
          } catch (error) {
            response.data = response.data;
          }

          request.response = response;
        }
      }
    }

    return request;
  }
}
