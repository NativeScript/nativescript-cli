import CoreObject from './object';
import Dexie from 'dexie';
<<<<<<< Updated upstream
let indexedDBShim = require(process.env.DATABASE_LIB);
import utils from './utils';
let Kinvey = require('../kinvey');
=======
import utils from '../utils';
import Kinvey from '../kinvey';
const indexedDBShim = require(process.env.KINVEY_DATABASE_LIB);
>>>>>>> Stashed changes

// Setup Dexie dependencies
Dexie.dependencies.indexedDB = indexedDBShim;

<<<<<<< Updated upstream
if (process.env.PLATFORM_ENV === 'node') {
=======
if (process.env.KINVEY_PLATFORM_ENV === 'node') {
>>>>>>> Stashed changes
  Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
  Dexie.dependencies.IDBTransaction = require('fake-indexeddb/lib/FDBTransaction');
}

<<<<<<< Updated upstream
let version = 1;
=======
const version = 1;
>>>>>>> Stashed changes
const datbaseSymbol = Symbol();

class Database extends CoreObject {
  constructor(name = 'Kinvey') {
    super();

    // Set the database name
    this.name = name;

    // Create a new database
<<<<<<< Updated upstream
    let db = new Dexie(this.name);
=======
    const db = new Dexie(this.name);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    let database = Database.instance();
    let db = database.db;
=======
    const database = Database.instance();
    const db = database.db;
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    let database = Database.instance();
    let db = database.db;
=======
    const database = Database.instance();
    const db = database.db;
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    let database = Database.instance();
    let db = database.db;
=======
    const database = Database.instance();
    const db = database.db;
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    let database = this[datbaseSymbol];
    let kinvey = Kinvey.instance();

    if (!utils.isDefined(database)) {
      database = new Database(`Kinvey.${kinvey.appKey}`);
      this[datbaseSymbol] = database;
=======
    let database = Database[datbaseSymbol];

    if (!utils.isDefined(database)) {
      database = new Database(`Kinvey.${Kinvey.appKey}`);
      Database[datbaseSymbol] = database;
>>>>>>> Stashed changes
    }

    return database;
  }
}

export default Database;
