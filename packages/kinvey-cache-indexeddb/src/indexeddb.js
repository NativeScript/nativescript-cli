import Dexie from 'dexie';
import findIndex from 'lodash/findIndex';

const dbVersions = {};

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
