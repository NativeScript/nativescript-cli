import Request from './request';
import Response from './response';
import { CacheRack } from '../rack/racks/cacheRack';
import { NoResponseError } from '../errors';

/**
 * @private
 */
export default class LocalRequest extends Request {
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
