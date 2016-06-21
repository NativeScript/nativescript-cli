import { Middleware } from 'kinvey-rack/dist/middleware';

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
