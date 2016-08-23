import { Middleware } from 'kinvey-javascript-rack/dist/middleware';

/**
 * @private
 */
export class KinveyMiddleware extends Middleware {
  constructor(name = 'Kinvey Middleware') {
    super(name);
  }
}
