import CoreObject from './object';
import Dexie from 'dexie';
import indexedDBShim from '/* @echo DATABASE_LIB */';
import utils from './utils';
import Kinvey from '../kinvey';

// Setup Dexie dependencies
Dexie.dependencies.indexedDB = indexedDBShim;

// @if PLATFORM_ENV='node'
Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
Dexie.dependencies.IDBTransaction = require('fake-indexeddb/lib/FDBTransaction');
// @endif

let version = 1;
const datbaseSymbol = Symbol();

class Database extends CoreObject {
  constructor(name = `Kinvey.${Kinvey.appKey}`) {
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

    if (!utils.isDefined(database)) {
      database = new Database();
      this[datbaseSymbol] = database;
    }

    return database;
  }
}

export default Database;
