import CoreObject from './object';
import Dexie from 'dexie';
let indexedDBShim = require(process.env.DATABASE_LIB);
import utils from './utils';
let Kinvey = require('../kinvey');

// Setup Dexie dependencies
Dexie.dependencies.indexedDB = indexedDBShim;

if (process.env.PLATFORM_ENV === 'node') {
  Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
  Dexie.dependencies.IDBTransaction = require('fake-indexeddb/lib/FDBTransaction');
}

let version = 1;
const datbaseSymbol = Symbol();

class Database extends CoreObject {
  constructor(name = 'Kinvey') {
    super();

    // Set the database name
    this.name = name;

    // Create a new database
    let db = new Dexie(this.name);
    this.db = db;

    // Define the schema
    db.version(version).stores({
      data: '_id'
    });

    // Open the database
    db.open();
  }

  /**
   * Read a document from the database.
   *
   * @param  {String}  id   Id of the document.
   * @return {Promise}      The document.
   */
  static read(id = '') {
    let database = Database.instance();
    let db = database.db;

    // Open a read transaction
    return db.transaction('r', db.data, () => {
      // Retrieve the document
      return db.data.where('_id').equals(id).first();
    });
  }

  /**
   * Save a document to the database.
   *
   * @param  {Object}   doc The document to be saved.
   * @return {Promise}      The document.
   */
  static save(doc = {}) {
    let database = Database.instance();
    let db = database.db;

    // Open a read/write transaction
    return db.transaction('rw', db.data, () => {
      // Add the document
      db.data.add(doc);
    });
  }

  /**
   * Delete a document from the database.
   *
   * @param  {String}  id   Id of the document.
   * @return {Promise}      The document.
   */
  static destroy(id = '') {
    let database = Database.instance();
    let db = database.db;

    // Open a read/write transaction
    return db.transaction('rw', db.data, () => {
      // Delete the document
      return db.data.where('_id').equals(id).delete();
    });
  }

  /**
   * Singleton instance of the Database
   *
   * @return {Database} Database instance.
   */
  static instance() {
    let database = this[datbaseSymbol];
    let kinvey = Kinvey.instance();

    if (!utils.isDefined(database)) {
      database = new Database(`Kinvey.${kinvey.appKey}`);
      this[datbaseSymbol] = database;
    }

    return database;
  }
}

export default Database;
