const SQLite = require('nativescript-sqlite');

const MASTER_TABLE_NAME = 'sqlite_master';

function execute(dbName, tableName, sqlQueries, write = false) {
  const escapedTableName = `"${tableName}"`;
  const isMaster = tableName === MASTER_TABLE_NAME;

  return new SQLite(dbName)
    .then((db) => {
      // This will set the database to return the results as an array of objects
      db.resultType(SQLite.RESULTSASOBJECT);

      if (write && !isMaster) {
        db
          .execSQL(`CREATE TABLE IF NOT EXISTS ${escapedTableName} (key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)`)
          .then(() => db);
      }

      return db;
    })
    .then((db) => {
      return Promise.all(
        sqlQueries.map(([sqlQuery, parameters = []]) => {
          let promise;

          if (write) {
            promise = db.execSQL(sqlQuery.replace('#{table}', escapedTableName), parameters);
          } else {
            promise = db.all(sqlQuery, parameters);
          }

          return promise
            .then((resultSet = []) => {
              if (write) {
                return resultSet;
              } else if (!write && Array.isArray(resultSet) && resultSet.length > 0) {
                return resultSet.map((row) => {
                  try {
                    return isMaster ? row.value : JSON.parse(row.value);
                  } catch (error) {
                    // Catch the error
                    return row.value;
                  }
                });
              }
            });
        })
      )
        .then((responses) => {
          return db
            .close()
            .then(() => responses);
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
  const response = await execute(dbName, tableName, [['SELECT value FROM #{table}']]);
  return response.result;
}

export async function count(dbName, tableName) {
  const docs = await find(dbName, tableName);
  return docs.length;
}

export async function findById(dbName, tableName, id) {
  const response = await execute(dbName, tableName, [['SELECT value FROM #{table} WHERE key = ?', [id]]]);
  return response.result.shift();
}

export async function save(dbName, tableName, docs = []) {
  const sqlQueries = docs.map((doc) => ['REPLACE INTO #{table} (key, value) VALUES (?, ?)', [doc._id, JSON.stringify(doc)]]);
  await execute(dbName, tableName, sqlQueries, true);
  return docs;
}

export async function removeById(dbName, tableName, id) {
  await execute(dbName, tableName, [['DELETE FROM #{table} WHERE key = ?', [id]]], true);
}

export async function clear(dbName, tableName) {
  await execute(dbName, MASTER_TABLE_NAME, [[`DROP TABLE IF EXISTS '${tableName}'`]], true);
  return true;
}

export async function clearAll(dbName) {
  const response = await execute(dbName, MASTER_TABLE_NAME, [['SELECT name AS value FROM #{collection} WHERE type = ?', ['table']]]);
  const tables = response.result;

  if (tables.length > 0) {
    const sqlQueries = tables
      .filter(table => (/^[a-zA-Z0-9-]{1,128}/).test(table))
      .map(table => [`DROP TABLE IF EXISTS '${table}'`]);
    await execute(dbName, MASTER_TABLE_NAME, sqlQueries, true);
  }

  return true;
}
