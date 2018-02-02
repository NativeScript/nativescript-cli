import { Promise } from 'es6-promise';

import { KinveyError } from '../../../errors';

import { webSqlCollectionsMaster, webSqlDatabaseSize } from '../utils';

export class WebSqlSqlModule {
  _databaseName;

  constructor(databaseName) {
    this._databaseName = databaseName;
  }

  // TODO: refactor this at some point after redesign
  openTransaction(collection, query, parameters, write = false) {
    const escapedCollection = `"${collection}"`;
    const isMaster = collection === webSqlCollectionsMaster;
    const isMulti = Array.isArray(query);
    query = isMulti ? query : [[query, parameters]];

    return new Promise((resolve, reject) => {
      try {
        const db = global.openDatabase(this._databaseName, 1, 'Kinvey Cache', webSqlDatabaseSize);
        const writeTxn = write || typeof db.readTransaction !== 'function';

        db[writeTxn ? 'transaction' : 'readTransaction']((tx) => {
          if (write && !isMaster) {
            tx.executeSql(`CREATE TABLE IF NOT EXISTS ${escapedCollection} ` +
              '(key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)');
          }

          let pending = query.length;
          const responses = [];

          if (pending === 0) {
            resolve(isMulti ? responses : responses.shift());
          } else {
            query.forEach((parts) => {
              const sql = parts[0].replace('#{collection}', escapedCollection);

              tx.executeSql(sql, parts[1], (_, resultSet) => {
                let response = [];

                if (resultSet.rows.length > 0) {
                  for (let i = 0, len = resultSet.rows.length; i < len; i += 1) {
                    try {
                      const value = resultSet.rows.item(i).value; // eslint-disable-line prefer-destructuring
                      const entity = isMaster ? value : JSON.parse(value);
                      response.push(entity);
                    } catch (error) {
                      // Catch the error
                    }
                  }
                } else {
                  response = resultSet.rowsAffected;
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
          error = typeof error === 'string' ? error : error.message;

          if (error && error.indexOf('no such table') === -1) {
            return resolve([]);
          }

          const query = 'SELECT name AS value from #{collection} WHERE type = ? AND name = ?';
          const parameters = ['table', collection];

          return this.openTransaction(webSqlCollectionsMaster, query, parameters).then((response) => {
            if (response === 0) {
              return resolve([]);
            }

            return reject(new KinveyError(`Unable to open a transaction for the ${collection}`
              + ` collection on the ${this._databaseName} WebSQL database.`));
          }).catch(reject);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
