import Promise from 'es6-promise';
import { KinveyError, NotFoundError, isDefined } from 'kinvey-js-sdk/dist/export';
import map from 'lodash/map';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';

const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const masterCollectionName = 'sqlite_master';
const size = 5 * 1000 * 1000; // Database size in bytes
let dbCache = {};
let isSupported;

export class WebSQLAdapter {
  constructor(name = 'kinvey') {
    if (isDefined(name) === false) {
      throw new KinveyError('A name is required to use the WebSQL adapter.', name);
    }

    if (isString(name) === false) {
      throw new KinveyError('The name must be a string to use the WebSQL adapter', name);
    }

    this.name = name;
  }

  openTransaction(collection, query, parameters, write = false) {
    let db = dbCache[this.name];
    const escapedCollection = `"${collection}"`;
    const isMaster = collection === masterCollectionName;
    const isMulti = isArray(query);
    query = isMulti ? query : [[query, parameters]];

    return new Promise((resolve, reject) => {
      try {
        if (isDefined(db) === false) {
          db = global.openDatabase(this.name, 1, 'Kinvey Cache', size);
          dbCache[this.name] = db;
        }

        const writeTxn = write || isFunction(db.readTransaction) === false;
        db[writeTxn ? 'transaction' : 'readTransaction']((tx) => {
          if (write && isMaster === false) {
            tx.executeSql(`CREATE TABLE IF NOT EXISTS ${escapedCollection} ` +
              '(key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)');
          }

          let pending = query.length;
          const responses = [];

          if (pending === 0) {
            resolve(isMulti ? responses : responses.shift());
          } else {
            forEach(query, (parts) => {
              const sql = parts[0].replace('#{collection}', escapedCollection);

              tx.executeSql(sql, parts[1], (_, resultSet) => {
                const response = {
                  rowCount: resultSet.rowsAffected,
                  result: []
                };

                if (resultSet.rows.length > 0) {
                  for (let i = 0, len = resultSet.rows.length; i < len; i += 1) {
                    try {
                      const value = resultSet.rows.item(i).value;
                      const entity = isMaster ? value : JSON.parse(value);
                      response.result.push(entity);
                    } catch (error) {
                      // Catch the error
                    }
                  }
                }

                responses.push(response);
                pending -= 1;

                if (pending === 0) {
                  resolve(isMulti ? responses : responses.shift());
                }
              });
            });
          }
        }, (error) => {
          error = isString(error) ? error : error.message;

          if (error && error.indexOf('no such table') === -1) {
            return reject(new NotFoundError(`The ${collection} collection was not found on`
              + ` the ${this.name} WebSQL database.`));
          }

          const query = 'SELECT name AS value from #{collection} WHERE type = ? AND name = ?';
          const parameters = ['table', collection];

          return this.openTransaction(masterCollectionName, query, parameters).then((response) => {
            if (response.result.length === 0) {
              return reject(new NotFoundError(`The ${collection} collection was not found on`
                + ` the ${this.name} WebSQL database.`));
            }

            return reject(new KinveyError(`Unable to open a transaction for the ${collection}`
              + ` collection on the ${this.name} WebSQL database.`));
          }).catch((error) => {
            reject(error);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  find(collection) {
    const sql = 'SELECT value FROM #{collection}';
    return this.openTransaction(collection, sql, [])
      .then(response => response.result);
  }

  findById(collection, id) {
    const sql = 'SELECT value FROM #{collection} WHERE key = ?';
    return this.openTransaction(collection, sql, [id])
      .then(response => response.result)
      .then((entities) => {
        if (entities.length === 0) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
            + ` collection on the ${this.name} WebSQL database.`);
        }

        return entities[0];
      });
  }

  save(collection, entities) {
    const queries = [];
    let singular = false;

    if (!isArray(entities)) {
      singular = true;
      entities = [entities];
    }

    if (entities.length === 0) {
      return Promise.resolve(null);
    }

    entities = map(entities, (entity) => {
      queries.push([
        'REPLACE INTO #{collection} (key, value) VALUES (?, ?)',
        [entity[idAttribute], JSON.stringify(entity)]
      ]);

      return entity;
    });

    return this.openTransaction(collection, queries, null, true)
      .then(() => (singular ? entities[0] : entities));
  }

  removeById(collection, id) {
    const queries = [
      ['SELECT value FROM #{collection} WHERE key = ?', [id]],
      ['DELETE FROM #{collection} WHERE key = ?', [id]],
    ];
    return this.openTransaction(collection, queries, null, true)
      .then((response) => {
        const entities = response[0].result;
        let count = response[1].rowCount;
        count = count || entities.length;

        if (count === 0) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
            + ` collection on the ${this.name} WebSQL database.`);
        }

        return { count: count };
      });
  }

  clear() {
    return this.openTransaction(
      masterCollectionName,
      'SELECT name AS value FROM #{collection} WHERE type = ?',
      ['table'],
      false
    )
      .then(response => response.result)
      .then((tables) => {
        // If there are no tables, return.
        if (tables.length === 0) {
          return null;
        }

        // Drop all tables. Filter tables first to avoid attempting to delete
        // system tables (which will fail).
        const queries = tables
          .filter(table => (/^[a-zA-Z0-9-]{1,128}/).test(table))
          .map(table => [`DROP TABLE IF EXISTS '${table}'`]);
        return this.openTransaction(masterCollectionName, queries, null, true);
      })
      .then(() => {
        dbCache = {};
        return null;
      });
  }

  static load(name) {
    const adapter = new WebSQLAdapter(name);

    if (isDefined(global.openDatabase) === false) {
      return Promise.resolve(undefined);
    }

    if (isDefined(isSupported)) {
      if (isSupported === true) {
        return Promise.resolve(adapter);
      }

      return Promise.resolve(undefined);
    }

    return adapter.save('__testSupport', { _id: '1' })
      .then(() => {
        isSupported = true;
        return adapter;
      })
      .catch(() => {
        isSupported = false;
        return undefined;
      });
  }
}
