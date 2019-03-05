const SQLite = require('nativescript-sqlite');

const MASTER_TABLE_NAME = 'sqlite_master';

function execute(dbName, tableName, sqlQueries, write = false) {
  const escapedTableName = `"${tableName}"`;
  const isMaster = tableName === MASTER_TABLE_NAME;

  return new SQLite(dbName)
    .then((db) => {
      // This will set the database to return the results as an array of objects
      db.resultType(SQLite.RESULTSASOBJECT);

      if (!isMaster) {
        db
          .execSQL(`CREATE TABLE IF NOT EXISTS ${escapedTableName} (key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)`)
          .then(() => db);
      }

      return db;
    })
    .then((db) => {
      const promises = sqlQueries.map(([sqlQuery, parameters = []]) => {
        let promise;

        if (write) {
          promise = db.execSQL(sqlQuery.replace('#{table}', escapedTableName), parameters);
        } else {
          promise = db.all(sqlQuery.replace('#{table}', escapedTableName), parameters);
        }

        return promise
          .then((resultSet = []) => {
            if (!write && Array.isArray(resultSet) && resultSet.length > 0) {
              return resultSet.map((row) => {
                try {
                  return isMaster ? row.value : JSON.parse(row.value);
                } catch (error) {
                  // Catch the error
                  return row.value;
                }
              });
            }

            return resultSet;
          });
      });
      return Promise.all(promises)
        .then((results) => {
          return results.reduce(($result, result) => {
            return $result.concat(result);
          }, []);
        })
        .then((result) => {
          return db
            .close()
            .then(() => result);
        })
        .catch((error) => {
          return db
            .close()
            .then(() => {
              throw error;
            });
        });
    });
}

export default class SqliteStore {
  constructor(dbName, tableName) {
    this.dbName = dbName;
    this.tableName = tableName;
  }

  async find() {
    const docs = await execute(this.dbName, this.tableName, [['SELECT value FROM #{table}']]);
    return docs;
  }

  async count() {
    const result = await execute(this.dbName, this.tableName, [['SELECT COUNT(DISTINCT key) AS value FROM #{table}']]);
    return result.shift() || 0;
  }

  async findById(id) {
    const docs = await execute(this.dbName, this.tableName, [['SELECT value FROM #{table} WHERE key = ?', [id]]]);
    return docs.shift();
  }

  async save(docs = []) {
    const sqlQueries = docs.map((doc) => ['REPLACE INTO #{table} (key, value) VALUES (?, ?)', [doc._id, JSON.stringify(doc)]]);
    await execute(this.dbName, this.tableName, sqlQueries, true);
    return docs;
  }

  async removeById(id) {
    const responses = await execute(this.dbName, this.tableName, [['DELETE FROM #{table} WHERE key = ?', [id]]], true);
    return responses.shift();
  }

  async clear() {
    await execute(this.dbName, this.tableName, [['DROP TABLE IF EXISTS #{table}']], true);
    return true;
  }

  async clearAll() {
    const tables = await execute(this.dbName, MASTER_TABLE_NAME, [['SELECT name AS value FROM #{table} WHERE type = ?', ['table']]]);

    if (tables.length > 0) {
      await Promise.all(tables.map(tableName => execute(this.dbName, tableName, [['DROP TABLE IF EXISTS #{table}']], true)));
    }

    return true;
  }
}
