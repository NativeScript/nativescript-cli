import { KinveyMiddleware } from '../middleware';

/**
 * @private
 */
export class SerializeMiddleware extends KinveyMiddleware {
  constructor(name = 'Kinvey Serialize Middleware') {
    super(name);
  }

  async handle(request) {
    request = await super.handle(request);

    if (request && request.body) {
      const contentType = request.headers.get('content-type');

      if (contentType) {
        if (contentType.indexOf('application/json') === 0) {
          request.body = JSON.stringify(request.body);
        } else if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
          const body = request.body;
          const keys = Object.keys(body);
          const str = [];

          for (const key of keys) {
            str.push(`${global.encodeURIComponent(key)}=${global.encodeURIComponent(body[key])}`);
          }

          request.body = str.join('&');
        }
      }
    }

    return request;
  }
}
