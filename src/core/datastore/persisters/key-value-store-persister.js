import { Client } from '../../client';

import { KeyValuePersister } from './key-value-persister';

export class KeyValueStorePersister extends KeyValuePersister {
  get _databaseName() {
    return Client.sharedInstance().appKey;
  }

  readEntity(key, entityId) {
    this._throwNotImplementedError();
  }

  writeEntity(key, entity) {
    this._throwNotImplementedError();
  }

  deleteEntity(key, entityId) {
    this._throwNotImplementedError();
  }
}
