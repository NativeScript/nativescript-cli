import Dexie from 'dexie';
import sift from 'sift';
import findIndex from 'lodash/findIndex';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import { nested } from './utils';

const dbVersions = {};

function findAddOn(db) {
  // eslint-disable-next-line no-param-reassign
  db.Table.prototype.find = async function find(query) {
    const collection = this.toCollection();
    let docs = await collection.toArray();

    if (query) {
      const {
        filter,
        sort,
        limit,
        skip,
        fields
      } = query;

      if (filter && !isEmpty(filter)) {
        docs = sift(filter, docs);
      }

      /* eslint-disable no-restricted-syntax, no-prototype-builtins  */
      if (sort) {
        docs.sort((a, b) => {
          for (const field in sort) {
            if (sort.hasOwnProperty(field)) {
              // Find field in objects.
              const aField = nested(a, field);
              const bField = nested(b, field);
              const modifier = sort[field]; // 1 (ascending) or -1 (descending).

              if ((aField !== null && typeof aField !== 'undefined')
              && (bField === null || typeof bField === 'undefined')) {
                return 1 * modifier;
              } else if ((bField !== null && typeof bField !== 'undefined')
                && (aField === null || typeof aField === 'undefined')) {
                return -1 * modifier;
              } else if (typeof aField === 'undefined' && bField === null) {
                return 0;
              } else if (aField === null && typeof bField === 'undefined') {
                return 0;
              } else if (aField !== bField) {
                return (aField < bField ? -1 : 1) * modifier;
              }
            }
          }

          return 0;
        });
      }
      /* eslint-enable no-restricted-syntax, no-prototype-builtins */

      if (skip > 0) {
        if (limit < Infinity) {
          docs = docs.slice(skip, skip + limit);
        } else {
          docs = docs.slice(skip);
        }
      }

      if (isArray(fields) && fields.length > 0) {
        docs = docs.map((doc) => {
          const keys = Object.keys(doc);
          keys.forEach((key) => {
            if (fields.indexOf(key) === -1) {
              // eslint-disable-next-line no-param-reassign
              delete doc[key];
            }
          });

          return doc;
        });
      }
    }

    return docs;
  };
}

// Register the addon to be included by default (optional)
Dexie.addons.push(findAddOn);

class IndexedDB extends Dexie {
  hasTable(tableName) {
    const index = findIndex(this.tables, table => table.name === tableName);
    return index !== -1;
  }

  static async open(dbName, tableName) {
    const db = new IndexedDB(dbName);

    // Open the database
    if (!db.isOpen()) {
      try {
        await db.open();
      } catch (error) {
        if (error.name !== Dexie.errnames.NoSuchDatabase) {
          throw error;
        }
      }
    }

    // Add table
    if (!db.hasTable(tableName)) {
      const nextVersion = db.verno + 1;

      // Close the database
      db.close();

      // Create the new schema
      const newSchema = {};
      newSchema[tableName] = '_id';
      const versions = dbVersions[db.name] || {};
      versions[nextVersion] = newSchema;
      dbVersions[db.name] = versions;


      // Upgrade the database
      const upgradedDB = new IndexedDB(db.name);
      Object.keys(versions).forEach((version) => {
        const schema = versions[version];
        upgradedDB.version(parseInt(version, 10)).stores(schema);
      });
      await upgradedDB.open();

      // Return the upgraded database
      return upgradedDB;
    }

    return db;
  }
}

export async function find(dbName, tableName, query) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  const docs = await table.find(query);
  db.close();
  return docs;
}

export async function count(dbName, tableName, query) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  const docs = await table.find(query);
  db.close();
  return docs.length;
}

export async function findById(dbName, tableName, id) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  const doc = await table.get(id);
  db.close();
  return doc;
}

export async function save(dbName, tableName, docs = []) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  await table.bulkPut(docs);
  db.close();
  return docs;
}

export async function remove(dbName, tableName, query) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  const docs = await table.find(query);
  const keys = docs.map(doc => doc._id);
  await table.bulkDelete(keys);
  db.close();
  return docs.length;
}

export async function removeById(dbName, tableName, id) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  await table.delete(id);
  db.close();
  return 1;
}

export async function clear(dbName, tableName) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  await table.clear();
  db.close();
  return true;
}

export async function clearAll(appKey) {
  const dbNames = await IndexedDB.getDatabaseNames();
  const promises = dbNames.map((dbName) => {
    if (dbName.indexOf(appKey) === 0) {
      return IndexedDB.delete(dbName);
    }
    return Promise.resolve();
  });
  await Promise.all(promises);
}
