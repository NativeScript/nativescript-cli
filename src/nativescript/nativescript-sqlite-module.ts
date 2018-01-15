import { KeyValueStorePersister } from '../core/datastore';
import { sqliteCollectionsMaster } from '../core/datastore/persisters';

const NativeScriptSQLite = require('nativescript-sqlite');

export class NativescriptSqliteModule {
  private _databaseName: string;

  constructor(storeName) {
    this._databaseName = storeName;
  }

  openTransaction(collection: string, query: any[], parameters: any[], write = false) {
    const escapedCollection = `"${collection}"`;
    const isMaster = collection === sqliteCollectionsMaster;
    const isMulti = Array.isArray(query);
    query = isMulti ? query : [[query, parameters]];

    return new NativeScriptSQLite(this._databaseName)
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
              .then(() => Promise.reject(error));
          });
      });
  }
}
