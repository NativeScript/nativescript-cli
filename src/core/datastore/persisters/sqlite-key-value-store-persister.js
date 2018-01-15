import * as NativeScriptSQLite from 'nativescript-sqlite';

import { KinveyError } from '../../errors';

import { KeyValueStorePersister } from './key-value-store-persister';
import { sqliteCollectionsMaster } from './utils';
import { ensureArray } from '../../utils';

export class SqliteKeyValueStorePersister extends KeyValueStorePersister {
  getKeys() {
    const query = 'SELECT name AS value FROM #{collection} WHERE type = ?';
    return this._openTransaction(sqliteCollectionsMaster, query, ['table'], false)
      .then((response) => {
        return response.result
          .filter(table => (/^[a-zA-Z0-9-]{1,128}/).test(table));
      });
  }

  // protected methods

  _readFromPersistance(collection) {
    const sql = 'SELECT value FROM #{collection}';
    return this._openTransaction(collection, sql, [])
      .then(response => response.result);
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
    return this._openTransaction(collection, 'DELETE FROM #{collection}', null, true)
      .then((response) => ({ count: response.rowCount }));
  }

  _readEntityFromPersistance(collection, entityId) {
    const sql = 'SELECT value FROM #{collection} WHERE key = ?';
    return this._openTransaction(collection, sql, [entityId])
      .then(response => response.result[0]);
  }

  _writeEntitiesToPersistance(collection, entities) {
    return this._upsertEntities(collection, ensureArray(entities));
  }

  _deleteEntityFromPersistance(collection, entityId) {
    const query = 'DELETE FROM #{collection} WHERE key = ?';
    return this._openTransaction(collection, query, [entityId], true)
      .then(response => response.rowCount);
  }

  // private methods

  _openTransaction(collection, query, parameters, write = false) {
    const escapedCollection = `"${collection}"`;
    const isMaster = collection === sqliteCollectionsMaster;
    const isMulti = Array.isArray(query);
    query = isMulti ? query : [[query, parameters]];

    return new NativeScriptSQLite(this.name)
      .then((db) => {
        // This will set the database to return the results as an array of objects
        db.resultType(NativeScriptSQLite.RESULTSASOBJECT);

        if (write && isMaster === false) {
          return db.execSQL(`CREATE TABLE IF NOT EXISTS ${escapedCollection}`
            + ' (key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)')
            .then(() => db);
        }

        return db;
      })
      .then((db) => {
        const responses = [];

        if (query.length === 0) {
          return db.close()
            .then(() => {
              return isMulti ? responses : responses.shift();
            });
        }

        return query.reduce((prev, parts) => {
          const sql = parts[0].replace('#{collection}', escapedCollection);

          return prev
            .then(() => {
              if (write === false) {
                return db.all(sql, parts[1]);
              }

              return db.execSQL(sql, parts[1]);
            })
            .then((resultSet = []) => {
              if (write === false && Array.isArray(resultSet) && resultSet.length > 0) {
                for (let i = 0, len = resultSet.length; i < len; i += 1) {
                  try {
                    const row = resultSet[i];
                    const entity = isMaster ? row.value : JSON.parse(row.value);
                    responses.push(entity);
                  } catch (error) {
                    // Catch the error
                  }
                }
              } else if (write === true) {
                responses.push(resultSet);
              }

              return responses;
            });
        }, Promise.resolve())
          .then((response) => {
            return db.close()
              .then(() => response);
          })
          .catch((error) => {
            return db.close()
              .then(() => {
                throw error;
              });
          });
      });
  }

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

    return this._openTransaction(collection, queries, null, true)
      .then(() => (singular ? entities[0] : entities));
  }
}
