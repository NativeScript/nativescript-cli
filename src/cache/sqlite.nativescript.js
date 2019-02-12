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

export async function find(dbName, tableName) {
  const docs = await execute(dbName, tableName, [['SELECT value FROM #{table}']]);
  return docs;
}

export async function count(dbName, tableName) {
  const result = await execute(dbName, tableName, [['SELECT COUNT(DISTINCT key) AS value FROM #{table}']]);
  return result.shift() || 0;
}

export async function findById(dbName, tableName, id) {
  const docs = await execute(dbName, tableName, [['SELECT value FROM #{table} WHERE key = ?', [id]]]);
  return docs.shift();
}

export async function save(dbName, tableName, docs = []) {
  const sqlQueries = docs.map((doc) => ['REPLACE INTO #{table} (key, value) VALUES (?, ?)', [doc._id, JSON.stringify(doc)]]);
  await execute(dbName, tableName, sqlQueries, true);
  return docs;
}

export async function removeById(dbName, tableName, id) {
  const responses = await execute(dbName, tableName, [['DELETE FROM #{table} WHERE key = ?', [id]]], true);
  return responses.shift();
}

export async function clear(dbName, tableName) {
  await execute(dbName, tableName, [['DROP TABLE IF EXISTS #{table}']], true);
  return true;
}

export async function clearAll(dbName) {
  const tables = await execute(dbName, MASTER_TABLE_NAME, [['SELECT name AS value FROM #{table} WHERE type = ?', ['table']]]);

  if (tables.length > 0) {
    await Promise.all(tables.map(tableName => execute(dbName, tableName, [['DROP TABLE IF EXISTS #{table}']], true)));
  }

  return true;
}
