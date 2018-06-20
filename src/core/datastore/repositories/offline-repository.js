import { Client } from '../../client';

import { Repository } from './repository';

/**
 * @private
 */
export class OfflineRepository extends Repository {
  clear() {
    this._throwNotImplementedError();
  }

  _throwNotImplementedError() {
    throw new Error('Method of OfflineRepository not implemented');
  }

  // protected methods

  _getAppKey() {
    return Client.sharedInstance().appKey;
  }
}
