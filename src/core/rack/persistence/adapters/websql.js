import { KinveyError, NotFoundError } from '../../../errors';
import map from 'lodash/map';
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const masterCollectionName = 'sqlite_master';
const size = 5 * 1000 * 1000; // Database size in bytes
let webSQL = null;
const dbCache = {};

if (typeof window !== 'undefined') {
  webSQL = {
    openDatabase: typeof openDatabase !== 'undefined' ? openDatabase : global.openDatabase
  };
}

/**
 * @private
 */
export class WebSQL {
  constructor(name = 'kinvey') {
    this.name = name;
  }

  openTransaction(collection, query, parameters, write = false) {
    let db = dbCache[this.name];
    const escapedCollection = `"${collection}"`;
    const isMaster = collection === masterCollectionName;
    const isMulti = isArray(query);

    query = isMulti ? query : [[query, parameters]];

    if (!db) {
      db = webSQL.openDatabase(this.name, 1, '', size);
      dbCache[this.name] = db;
    }

    const promise = new Promise((resolve, reject) => {
      const writeTxn = write || !isFunction(db.readTransaction);
      db[writeTxn ? 'transaction' : 'readTransaction'](tx => {
        if (write && !isMaster) {
          tx.executeSql(`CREATE TABLE IF NOT EXISTS ${escapedCollection} ` +
            `(key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)`);
        }

        let pending = query.length;
        const responses = [];

        forEach(query, parts => {
          const sql = parts[0].replace('#{collection}', escapedCollection);

          tx.executeSql(sql, parts[1], (_, resultSet) => {
            const response = {
              rowCount: resultSet.rowsAffected,
              result: []
            };

            if (resultSet.rows.length) {
              for (let i = 0, len = resultSet.rows.length; i < len; i++) {
                try {
                  const value = resultSet.rows.item(i).value;
                  const entity = isMaster ? value : JSON.parse(value);
                  response.result.push(entity);
                } catch (err) {
                  // Catch the error
                }
              }
            }

            responses.push(response);
            pending = pending - 1;

            if (pending === 0) {
              resolve(isMulti ? responses : responses.shift());
            }
          });
        });
      }, err => {
        err = isString(err) ? err : err.message;

        if (err && err.indexOf('no such table') === -1) {
          return reject(new NotFoundError(`The ${collection} collection was not found on ` +
            `the ${this.name} webSQL database.`));
        }

        const query = `SELECT name AS value from #{collection} WHERE type = ? AND name = ?`;
        const parameters = ['table', collection];

        this.openTransaction(masterCollectionName, query, parameters).then(response => {
          if (response.result.length === 0) {
            return reject(new NotFoundError(`The ${collection} collection was not found on ` +
              `the ${this.name} webSQL database.`));
          }

          reject(new KinveyError(`Unable to open a transaction for the ${collection} ` +
            `collection on the ${this.name} webSQL database.`));
        }).catch(err => {
          reject(new KinveyError(`Unable to open a transaction for the ${collection} ` +
            `collection on the ${this.name} webSQL database.`, err));
        });
      });
    });

    return promise;
  }

  find(collection) {
    const sql = 'SELECT value FROM #{collection}';
    const promise = this.openTransaction(collection, sql, []).then(response => {
      return response.result;
    }).catch(error => {
      if (error instanceof NotFoundError) {
        return [];
      }

      throw error;
    });
    return promise;
  }

  findById(collection, id) {
    const sql = 'SELECT value FROM #{collection} WHERE key = ?';
    const promise = this.openTransaction(collection, sql, [id]).then(response => {
      const entities = response.result;

      if (entities.length === 0) {
        throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
          `collection on the ${this.name} webSQL database.`);
      }

      return entities[0];
    });
    return promise;
  }

  save(collection, entities) {
    const queries = [];
    entities = map(entities, entity => {
      queries.push([
        'REPLACE INTO #{collection} (key, value) VALUES (?, ?)',
        [entity[idAttribute], JSON.stringify(entity)]
      ]);

      return entity;
    });

    const promise = this.openTransaction(collection, queries, null, true).then(() => {
      return entities;
    });
    return promise;
  }

  removeById(collection, id) {
    const promise = this.openTransaction(collection, [
      ['SELECT value FROM #{collection} WHERE key = ?', [id]],
      ['DELETE FROM #{collection} WHERE key = ?', [id]],
    ], null, true).then(response => {
      const entities = response[0].result;
      let count = response[1].rowCount;
      count = count ? count : entities.length;

      if (count === 0) {
        throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection} ` +
          `collection on the ${this.name} webSQL database.`);
      }

      return {
        count: 1,
        entities: entities
      };
    });

    return promise;
  }

  static isSupported() {
    return webSQL ? true : false;
  }
}
