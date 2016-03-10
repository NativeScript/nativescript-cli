import { KinveyRequest } from './request';
import { Response } from './response';
import { NetworkRack } from '../rack/rack';
import { NoResponseError } from '../errors';

/**
 * @private
 */
export class NetworkRequest extends KinveyRequest {
  constructor(options) {
    super(options);
    this.rack = NetworkRack.sharedInstance();
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
    return this.rack.cancel();
  }
}
