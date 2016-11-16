import Request from './request';
import { NetworkRack } from './rack';

export default class NetworkRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.rack = new NetworkRack();
  }
}
