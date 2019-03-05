import isString from 'lodash/isString';
import KinveyError from '../../errors/kinvey';

const MASTER_TABLE_NAME = 'sqlite_master';
const SIZE = 2 * 1024 * 1024; // Database size in bytes

function execute(dbName, tableName, sqlQueries, write = false) {
  const escapedTableName = `"${tableName}"`;
  const isMaster = tableName === MASTER_TABLE_NAME;

  return new Promise((resolve, reject) => {
    try {
      const db = window.openDatabase(dbName, 1, 'Kinvey WebSQL', SIZE);
      const writeTxn = write || typeof db.readTransaction !== 'function';

      db[writeTxn ? 'transaction' : 'readTransaction']((tx) => {
        new Promise((resolve) => {
          if (write && !isMaster) {
            tx.executeSql(`CREATE TABLE IF NOT EXISTS ${escapedTableName} (key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)`, [], () => {
              resolve();
            });
          } else {
            resolve();
          }
        })
          .then(() => {
            return Promise.all(
              sqlQueries.map(([sqlQuery, parameters = []]) => {
                return new Promise((resolve) => {
                  tx.executeSql(sqlQuery.replace('#{table}', escapedTableName), parameters, (_, resultSet) => {
                    const response = {
                      rowCount: resultSet.rows.length || resultSet.rowsAffected,
                      result: []
                    };

                    if (resultSet.rows.length > 0) {
                      for (let i = 0, len = resultSet.rows.length; i < len; i += 1) {
                        const { value } = resultSet.rows.item(i);

                        try {
                          const doc = isMaster ? value : JSON.parse(value);
                          response.result.push(doc);
                        } catch (error) {
                          response.result.push(value);
                        }
                      }
                    }

                    resolve(response);
                  });
                });
              })
            );
          })
          .then((responses = []) => {
            return responses.reduce(({ rowCount = 0, result = [] }, response) => {
              return {
                rowCount: rowCount + response.rowCount,
                result: result.concat(response.result)
              };
            }, { rowCount: 0, result: [] });
          })
          .then(resolve)
          .catch(reject);
      }, (error) => {
        const errorMessage = isString(error) ? error : error.message;

        if (errorMessage && errorMessage.indexOf('no such table') === -1) {
          resolve({ rowCount: 0, result: [] });
        } else {
          const sql = 'SELECT name AS value from #{table} WHERE type = ? AND name = ?';
          const parameters = ['table', tableName];
          execute(dbName, MASTER_TABLE_NAME, [[sql, parameters]])
            .then((response) => {
              if (response.result.length === 0) {
                return resolve({ rowCount: 0, result: [] });
              }
              return reject(new KinveyError(`Unable to open a transaction for the ${tableName} collection on the ${dbName} WebSQL database.`));
            })
            .catch(reject);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export default class WebSQLStore {
  constructor(dbName, tableName) {
    this.dbName = dbName;
    this.tableName = tableName;
  }

  async find() {
    const response = await execute(this.dbName, this.tableName, [['SELECT value FROM #{table}']]);
    return response.result;
  }

  async count() {
    const response = await execute(this.dbName, this.tableName, [['SELECT COUNT(DISTINCT key) AS value FROM #{table}']]);
    return response.result.shift() || 0;
  }

  async findById(id) {
    const response = await execute(this.dbName, this.tableName, [['SELECT value FROM #{table} WHERE key = ?', [id]]]);
    return response.result.shift();
  }

  async save(docs = []) {
    const sqlQueries = docs.map((doc) => ['REPLACE INTO #{table} (key, value) VALUES (?, ?)', [doc._id, JSON.stringify(doc)]]);
    await execute(this.dbName, this.tableName, sqlQueries, true);
    return docs;
  }

  async removeById(id) {
    const response = await execute(this.dbName, this.tableName, [['DELETE FROM #{table} WHERE key = ?', [id]]], true);
    return response.rowCount;
  }

  async clear() {
    await execute(this.dbName, this.tableName, [['DROP TABLE IF EXISTS #{table}']], true);
    return true;
  }

  async clearAll() {
    const response = await execute(this.dbName, MASTER_TABLE_NAME, [['SELECT name AS value FROM #{table} WHERE type = ? AND value NOT LIKE ?', ['table', '__Webkit%']]]);
    const tables = response.result;

    if (tables.length > 0) {
      await Promise.all(tables.map(tableName => execute(this.dbName, tableName, [['DROP TABLE IF EXISTS #{table}']], true)));
    }

    return true;
  }
}
