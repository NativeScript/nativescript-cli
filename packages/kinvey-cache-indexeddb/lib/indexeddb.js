"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.find = find;
exports.count = count;
exports.findById = findById;
exports.save = save;
exports.remove = remove;
exports.removeById = removeById;
exports.clear = clear;
exports.clearAll = clearAll;

require("core-js/modules/web.dom.iterable");

var _dexie = _interopRequireDefault(require("dexie"));

var _sift = _interopRequireDefault(require("sift"));

var _findIndex = _interopRequireDefault(require("lodash/findIndex"));

var _isEmpty = _interopRequireDefault(require("lodash/isEmpty"));

const dbVersions = {};

function findAddOn(db) {
  // Makes it possible to use applyQuery() on collections.
  // eslint-disable-next-line no-param-reassign
  db.Table.prototype.find = function find(query) {
    let collection = this.toCollection();

    if (query) {
      const filter = query.filter,
            limit = query.limit,
            skip = query.skip; // let { fields } = query;

      if (filter) {
        if (!(0, _isEmpty.default)(filter)) {
          collection = collection.filter(doc => {
            const sifter = (0, _sift.default)(filter);
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
} // Register the addon to be included by default (optional)


_dexie.default.addons.push(findAddOn);

class IndexedDB extends _dexie.default {
  hasTable(tableName) {
    const index = (0, _findIndex.default)(this.tables, table => table.name === tableName);
    return index !== -1;
  }

  static async open(dbName, tableName) {
    const db = new IndexedDB(dbName); // Open the database

    if (!db.isOpen()) {
      try {
        await db.open();
      } catch (error) {
        if (error.name !== _dexie.default.errnames.NoSuchDatabase) {
          throw error;
        }
      }
    } // Add table


    if (!db.hasTable(tableName)) {
      const nextVersion = db.verno + 1; // Close the database

      db.close(); // Create the new schema

      const newSchema = {};
      newSchema[tableName] = '_id';
      const versions = dbVersions[db.name] || {};
      versions[nextVersion] = newSchema;
      dbVersions[db.name] = versions; // Upgrade the database

      const upgradedDB = new IndexedDB(db.name);
      Object.keys(versions).forEach(version => {
        const schema = versions[version];
        upgradedDB.version(parseInt(version, 10)).stores(schema);
      });
      await upgradedDB.open(); // Return the upgraded database

      return upgradedDB;
    }

    return db;
  }

}

async function find(dbName, tableName, query) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  const docs = await table.find(query).toArray();
  db.close();
  return docs;
}

async function count(dbName, tableName, query) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  const count = await table.find(query).count();
  db.close();
  return count;
}

async function findById(dbName, tableName, id) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  const doc = await table.get(id);
  db.close();
  return doc;
}

async function save(dbName, tableName, docs = []) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  await table.bulkPut(docs);
  db.close();
  return docs;
}

async function remove(dbName, tableName, query) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  const docs = await table.find(query).toArray();
  const keys = docs.map(doc => doc._id);
  await table.bulkDelete(keys);
  db.close();
  return docs.length;
}

async function removeById(dbName, tableName, id) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  await table.delete(id);
  db.close();
  return 1;
}

async function clear(dbName, tableName) {
  const db = await IndexedDB.open(dbName, tableName);
  const table = db.table(tableName);
  await table.clear();
  db.close();
  return true;
}

async function clearAll(appKey) {
  const dbNames = await IndexedDB.getDatabaseNames();
  const promises = dbNames.map(dbName => {
    if (dbName.indexOf(appKey) === 0) {
      return IndexedDB.delete(dbName);
    }

    return Promise.resolve();
  });
  await Promise.all(promises);
}