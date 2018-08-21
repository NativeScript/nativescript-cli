import Dexie from 'dexie';
import findIndex from 'lodash/findIndex';

const DB_CACHE = {};

function applyQueryAddon(db) {
  // Makes it possible to use applyQuery() on collections.
  // eslint-disable-next-line no-param-reassign
  db.Collection.prototype.applyQuery = function applyQuery(query) {
    if (query) {
      const queryObject = query.toQueryObject();
      const { limit, skip } = queryObject;
      // const filter = queryObject.query;

      if (limit) {
        this.limit(limit);
      }

      if (skip) {
        this.skip(skip);
      }
    }

    return this;
  };
}

// Register the addon to be included by default (optional)
Dexie.addons.push(applyQueryAddon);

class IndexedDB extends Dexie {
  hasTable(tableName) {
    const index = findIndex(this.tables, table => table.name === tableName);
    return index !== -1;
  }

  static async open(dbName, tableName) {
    const db = DB_CACHE[dbName] || new IndexedDB(dbName);

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
      // Close the database
      db.close();

      // Create the new schema
      const schema = {};
      schema[tableName] = '_id';

      // Upgrade the database
      const upgradedDB = new IndexedDB(db.name);
      upgradedDB.version(db.verno + 1).stores(schema);
      await upgradedDB.open();

      // Update the database cache
      DB_CACHE[dbName] = upgradedDB;

      // Return the upgraded database
      return upgradedDB;
    }

    // Update the database cache
    DB_CACHE[dbName] = db;

    return db;
  }
}

export async function find(dbName, tableName, query) {
  const db = await IndexedDB.open(dbName, tableName);
  const collection = db.table(tableName).toCollection();
  collection.applyQuery(query);
  return collection.toArray();
}

export async function count(dbName, tableName, query) {
  const db = await IndexedDB.open(dbName, tableName);
  const collection = db.table(tableName).toCollection();
  collection.applyQuery(query);
  return collection.count();
}

export async function findById(dbName, tableName, id) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  return table.get(id);
}

export async function save(dbName, tableName, docs = []) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  await table.bulkPut(docs);
  return docs;
}

export async function remove(dbName, tableName, query) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  const collection = table.toCollection();
  collection.applyQuery(query);
  const docs = collection.toArray();
  const keys = docs.map(doc => doc._id);
  await table.bulkDelete(keys);
  return docs.length;
}

export async function removeById(dbName, tableName, id) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  await table.delete(id);
  return 1;
}

export async function clear(dbName, tableName) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  return table.clear();
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
