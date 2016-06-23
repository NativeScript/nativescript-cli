import { Middleware } from 'kinvey-rack/dist/middleware';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

/**
 * @private
 */
export class KinveyMiddleware extends Middleware {
  constructor(name = 'Kinvey Middleware') {
    super(name);
  }

  async handle(request) {
    return super.handle(request);
  }
}
