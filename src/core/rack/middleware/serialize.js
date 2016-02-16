import { KinveyMiddleware } from '../middleware';

/**
 * @private
 */
export class SerializeMiddleware extends KinveyMiddleware {
  constructor(name = 'Kinvey Serialize Middleware') {
    super(name);
  }

  handle(request) {
    return super.handle(request).then(() => {
      if (request && request.data) {
        const contentType = request.headers['content-type'] || request.headers['Content-Type'];

        if (contentType.indexOf('application/json') === 0) {
          request.data = JSON.stringify(request.data);
        } else if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
          const data = request.data;
          const str = [];

          for (const p in data) {
            if (data.hasOwnProperty(p)) {
              str.push(`${global.encodeURIComponent(p)}=${global.encodeURIComponent(data[p])}`);
            }
          }

          request.data = str.join('&');
        }
      }

      return request;
    });
  }
}
