import { KinveyRequest } from './request';
import { Response } from './response';
import { CacheRack } from '../rack/rack';
import { NoResponseError } from '../errors';

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
      return this.rack.execute(this.toJSON());
    }).then(response => {
      if (!response) {
        throw new NoResponseError();
      }

      return new Response({
        statusCode: response.statusCode,
        headers: response.headers,
        data: response.data
      });
    }).then(response => {
      if (!response.isSuccess()) {
        throw response.error;
      }

      return response;
    });

    return promise;
  }

  cancel() {
    this.rack.cancel();
  }
}
