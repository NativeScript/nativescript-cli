import Request from './request';
import Response from './response';
import { NetworkRack } from '../rack/racks/networkRack';
import { NoResponseError } from '../errors';

/**
 * @private
 */
export default class NetworkRequest extends Request {
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
