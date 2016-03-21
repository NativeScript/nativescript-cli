import { KinveyRequest } from './request';
import { NetworkRack } from '../rack/rack';

/**
 * @private
 */
export class NetworkRequest extends KinveyRequest {
  constructor(options) {
    super(options);
    this.rack = NetworkRack.sharedInstance();
  }
}
