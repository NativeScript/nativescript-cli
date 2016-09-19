import { Middleware } from 'kinvey-javascript-rack';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

/**
 * @private
 */
export class ParseMiddleware extends Middleware {
  constructor(name = 'Kinvey Parse Middleware') {
    super(name);
  }

  async handle(request, response) {
    if (response && response.data) {
      const contentType = response.headers['content-type'] || response.headers['Content-Type'];

      if (contentType) {
        if (contentType.indexOf('application/json') === 0) {
          try {
            response.data = JSON.parse(response.data);
          } catch (error) {
            // Just catch the error
          }
        }
      }
    }

    return { response: response };
  }
}
