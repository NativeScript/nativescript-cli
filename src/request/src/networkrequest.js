import { Request } from './request';
import { NoResponseError, KinveyError } from '../../errors';
import { Response } from './response';
import { Rack } from 'kinvey-javascript-rack/dist/rack';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars

export class NetworkRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.rack = NetworkRequest.rack;
  }

  static get rack() {
    return NetworkRequest._rack;
  }

  static set rack(rack) {
    if (!rack || !(rack instanceof Rack)) {
      throw new KinveyError('Unable to set the rack of a NetworkRequest. It must be an instance of a Rack');
    }

    NetworkRequest._rack = rack;
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
