import { isDefined } from 'kinvey-js-sdk/dist/utils';
import { NotFoundError } from 'kinvey-js-sdk/dist/errors';
const nativeScriptSQLite = require('nativescript-sqlite');

const masterCollectionName = 'sqlite_master';
let isSupported;

class SQLiteAdapter {
  name: string;

  constructor(name = 'kinvey') {
    if (isDefined(name) === false) {
      throw new Error('A name is required to use the SQLite adapter.');
    }

    if (typeof name !== 'string') {
      throw new Error('The name must be a string to use the SQLite adapter');
    }

    this.name = name;
  }

  openTransaction(collection, query, parameters, write = false) {
    const escapedCollection = `"${collection}"`;
    const isMaster = collection === masterCollectionName;
    const isMulti = Array.isArray(query);
    query = isMulti ? query : [[query, parameters]];

    return new nativeScriptSQLite(this.name)
      .then((db) => {
        // This will set the database to return the results as an array of objects
        db.resultType(nativeScriptSQLite.RESULTSASOBJECT);

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

  find(collection) {
    const sql = 'SELECT value FROM #{collection}';
    return this.openTransaction(collection, sql, [])
      .catch(() => []);
  }

  findById(collection, id) {
    const sql = 'SELECT value FROM #{collection} WHERE key = ?';
    return this.openTransaction(collection, sql, [id])
      .then((entities) => {
        if (entities.length === 0) {
          throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
            + ` collection on the ${this.name} SQLite database.`);
        }

        return entities[0];
      })
      .catch(() => {
        throw new NotFoundError(`An entity with _id = ${id} was not found in the ${collection}`
            + ` collection on the ${this.name} SQLite database.`);
      });
  }

  save(collection, entities) {
    const queries = [];
    let singular = false;

    if (Array.isArray(entities) === false) {
      singular = true;
      entities = [entities];
    }

    if (entities.length === 0) {
      return Promise.resolve(null);
    }

    entities = entities.map((entity) => {
      queries.push([
        'REPLACE INTO #{collection} (key, value) VALUES (?, ?)',
        [entity._id, JSON.stringify(entity)]
      ]);

      return entity;
    });

    return this.openTransaction(collection, queries, null, true)
      .then(() => (singular ? entities[0] : entities));
  }

  removeById(collection, id) {
    const query = 'DELETE FROM #{collection} WHERE key = ?';
    return this.openTransaction(collection, query, [id], true)
      .then((response) => {
        const count = response[0];

        if (count === 0) {
          const errMsg = `An entity with _id = ${id} was not found in the ${collection} collection on the ${this.name} SQLite database.`;
          return Promise.reject(new NotFoundError(errMsg));
        }

        return { count };
      });
  }

  clear() {
    return this.openTransaction(
      masterCollectionName,
      'SELECT name AS value FROM #{collection} WHERE type = ?',
      ['table'],
      false
    )
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
      .then(() => null);
  }
}

export const sqLite = {
  load(name) {
    const db = new SQLiteAdapter(name);

    if (isDefined(nativeScriptSQLite) === false) {
      return Promise.resolve(undefined);
    }

    if (isDefined(isSupported)) {
      if (isSupported) {
        return Promise.resolve(db);
      }

      return Promise.resolve(undefined);
    }

    return db.save('__testSupport', { _id: '1' })
      .then(() => {
        isSupported = true;
        return db;
      })
      .catch(() => {
        isSupported = false;
        return undefined;
      });
  }
};
