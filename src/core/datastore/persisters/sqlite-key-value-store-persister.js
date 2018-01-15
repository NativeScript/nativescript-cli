import { KinveyError } from '../../errors';

import { KeyValueStorePersister } from './key-value-store-persister';
import { sqliteCollectionsMaster } from './utils';
import { ensureArray } from '../../utils';

// TODO: refactor this and WebSQL persister
export class SqliteKeyValueStorePersister extends KeyValueStorePersister {
  _sqlModule;

  constructor(sqlModule, cacheEnabled, ttl) {
    super(cacheEnabled, ttl);
    this._sqlModule = sqlModule;
  }

  getKeys() {
    const query = 'SELECT name AS value FROM #{collection} WHERE type = ?';
    return this._sqlModule.openTransaction(sqliteCollectionsMaster, query, ['table'], false)
      .then((response) => {
        return response.filter(table => (/^[a-zA-Z0-9-]{1,128}/).test(table));
      });
  }

  // protected methods

  _readFromPersistance(collection) {
    const sql = 'SELECT value FROM #{collection}';
    return this._sqlModule.openTransaction(collection, sql, [])
      .catch(() => []);
  }

  _writeToPersistance(collection, allEntities) {
    if (!allEntities) {
      return Promise.reject(new KinveyError('Invalid or missing entities array'));
    }

    return this._deleteFromPersistance(collection)
      .then(() => this._upsertEntities(collection, allEntities));
  }

  _deleteFromPersistance(collection) {
    // TODO: this should drop the table, instead of deleting all rows
    return this._sqlModule.openTransaction(collection, 'DELETE FROM #{collection}', undefined, true)
      .then((response) => ({ count: response }));
  }

  _readEntityFromPersistance(collection, entityId) {
    const sql = 'SELECT value FROM #{collection} WHERE key = ?';
    return this._sqlModule.openTransaction(collection, sql, [entityId])
      .then(response => response[0]);
  }

  _writeEntitiesToPersistance(collection, entities) {
    return this._upsertEntities(collection, ensureArray(entities));
  }

  _deleteEntityFromPersistance(collection, entityId) {
    const query = 'DELETE FROM #{collection} WHERE key = ?';
    return this._sqlModule.openTransaction(collection, query, [entityId], true);
  }

  // private methods

  _upsertEntities(collection, entities) {
    const singular = !Array.isArray(entities);
    entities = ensureArray(entities);

    if (entities.length === 0) {
      return Promise.resolve(null);
    }

    const queries = entities.map((entity) => {
      return [
        'REPLACE INTO #{collection} (key, value) VALUES (?, ?)',
        [entity._id, JSON.stringify(entity)]
      ];
    });

    return this._sqlModule.openTransaction(collection, queries, null, true)
      .then(() => (singular ? entities[0] : entities));
  }
}
