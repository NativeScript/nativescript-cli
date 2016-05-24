import { KinveyRequest } from './request';
import { CacheRack } from '../rack/rack';
import { NoResponseError } from '../errors';
import { KinveyResponse, KinveyResponseConfig } from './response';

/**
 * @private
 */
export default class CacheRequest extends KinveyRequest {
  constructor(options) {
    super(options);
    this.rack = CacheRack.sharedInstance();
  }

  async execute() {
    await super.execute();
    let response = await this.rack.execute(this);

    // Flip the executing flag to false
    this.executing = false;

    // Throw a NoResponseError if we did not receive
    // a response
    if (!response) {
      throw new NoResponseError();
    }

    // Make sure the response is an instance of the
    // Response class
    if (!(response instanceof KinveyResponse)) {
      const config = new KinveyResponseConfig({
        statusCode: response.statusCode,
        headers: response.headers,
        data: response.data
      });
      response = new KinveyResponse(config);
    }

    // Throw the response error if we did not receive
    // a successfull response
    if (!response.isSuccess()) {
      throw response.error;
    }

    // Just return the response
    return response;
  }

  async cancel() {
    await super.cancel();
    return this.rack.cancel();
  }
}
