import { KinveyRequest, Response } from './request';
import { NetworkRack } from '../rack/rack';
import { NoResponseError } from '../errors';

/**
 * @private
 */
export class NetworkRequest extends KinveyRequest {
  execute() {
    const promise = super.execute().then(() => {
      const networkRack = NetworkRack.sharedInstance();
      return networkRack.execute(this.toJSON());
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
    const networkRack = NetworkRack.sharedInstance();
    networkRack.cancel();
  }
}
