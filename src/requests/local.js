import { KinveyRequest, Response } from './request';
import { CacheRack } from '../rack/rack';
import { NoResponseError } from '../errors';

/**
 * @private
 */
export class LocalRequest extends KinveyRequest {
  execute() {
    const promise = super.execute().then(() => {
      const rack = CacheRack.sharedInstance();
      return rack.execute(this.toJSON());
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
    const rack = CacheRack.sharedInstance();
    rack.cancel();
  }
}
