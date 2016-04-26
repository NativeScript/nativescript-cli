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

    if (request && request.data) {
      const contentType = request.headers['content-type'] || request.headers['Content-Type'];

      if (contentType.indexOf('application/json') === 0) {
        request.data = JSON.stringify(request.data);
      } else if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
        const body = request.body;
        const str = [];

        for (const [key] of body) {
          str.push(`${global.encodeURIComponent(key)}=${global.encodeURIComponent(body[key])}`);
        }

        request.body = str.join('&');
      }
    }

    return request;
  }
}
