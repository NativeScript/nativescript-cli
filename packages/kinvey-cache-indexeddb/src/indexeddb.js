import Dexie from 'dexie';
import sift from 'sift';
import findIndex from 'lodash/findIndex';
import isEmpty from 'lodash/isEmpty';

const dbVersions = {};

function findAddOn(db) {
  // Makes it possible to use applyQuery() on collections.
  // eslint-disable-next-line no-param-reassign
  db.Table.prototype.find = function find(query) {
    let collection = this.toCollection();

    if (query) {
      const {
        filter,
        // sort,
        limit,
        skip
      } = query;
      // let { fields } = query;

      if (filter) {
        if (!isEmpty(filter)) {
          collection = collection.filter((doc) => {
            const sifter = sift(filter);
            return sifter([doc]);
          });
        }
      }

      if (skip > 0) {
        collection = collection.offset(skip);
      }

      if (limit < Infinity) {
        collection = collection.limit(limit);
      }
    }

    return collection;
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
  const docs = await table.find(query).toArray();
  db.close();
  return docs;
}

export async function count(dbName, tableName, query) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  const count = await table.find(query).count();
  db.close();
  return count;
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
  const docs = await table.find(query).toArray();
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
