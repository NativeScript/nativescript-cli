import Request from './request';

export default class NetworkRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.rack = this.client.networkRack;
  }
}
