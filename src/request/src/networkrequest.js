import Request from './request';
import { NetworkRack } from 'kinvey-javascript-rack';

export default class NetworkRequest extends Request {
  constructor(options = {}) {
    super(options);
    this.rack = new NetworkRack();
  }
}
