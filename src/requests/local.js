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
    const promise = super.execute().then(() => {
      return this.rack.execute(this);
    }).then(response => {
      if (!response) {
        throw new NoResponseError();
      }

      if (!(response instanceof Response)) {
        return new Response({
          statusCode: response.statusCode,
          headers: response.headers,
          data: response.data
        });
      }

      return response;
    }).then(response => {
      if (!response.isSuccess()) {
        throw response.error;
      }

      return response;
    });

    return promise;
  }

  cancel() {
    const promise = super.cancel().then(() => {
      return this.rack.cancel();
    });
    return promise;
  }
}
