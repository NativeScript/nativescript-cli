import { Request } from './request';
import { NoResponseError, KinveyError } from '../../errors';
import { Response } from './response';
import { NetworkRack } from 'kinvey-network-rack'; // eslint-disable-line import/no-extraneous-dependencies, import/no-unresolved
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

export class NetworkRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.rack = new NetworkRack();
  }

  async execute() {
    if (!this.rack) {
      throw new KinveyError('Unable to execute the request. Please provide a rack to execute the request.');
    }

    let response = await this.rack.execute(this);
    this.executing = false;

    if (!response) {
      throw new NoResponseError();
    }

    if (!(response instanceof Response)) {
      response = new Response({
        statusCode: response.statusCode,
        headers: response.headers,
        data: response.data
      });
    }

    return response;
  }

  cancel() {
    const promise = super.cancel().then(() => this.rack.cancel());
    return promise;
  }
}
