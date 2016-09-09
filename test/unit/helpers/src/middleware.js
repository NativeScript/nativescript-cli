import { Middleware } from 'kinvey-javascript-rack';

/**
 * @private
 */
export class KinveyMiddleware extends Middleware {
  constructor(name = 'Kinvey Middleware') {
    super(name);
  }
}
