import { KinveyRequest } from './request';
import { CacheRack } from '../rack/rack';
import { NoResponseError } from '../errors';
import { Response } from './response';

/**
 * @private
 */
export class LocalRequest extends KinveyRequest {
  constructor(options) {
    super(options);
    this.rack = CacheRack.sharedInstance();
  }

  execute() {
    return super.execute().then(() => this.rack.execute(this)).then(response => {
      // Throw a NoResponseError if we did not receive
      // a response
      if (!response) {
        throw new NoResponseError();
      }

      // Make sure the response is an instance of the
      // Response class
      if (!(response instanceof Response)) {
        response = new Response({
          statusCode: response.statusCode,
          headers: response.headers,
          data: response.data
        });
      }

      // Return the response
      return response;
    }).then(response => {
      // Flip the executing flag to false
      this.executing = false;

      // Throw the response error if we did not receive
      // a successfull response
      if (!response.isSuccess()) {
        throw response.error;
      }

      // Just return the response
      return response;
    });
  }

  cancel() {
    return super.cancel().then(() => this.rack.cancel());
  }
}
