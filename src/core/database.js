import Dexie from 'dexie';
import indexedDBShim from 'indexeddbshim';
Dexie.dependencies.indexedDB = indexedDBShim;
let version = 1;

class Database {
  constructor(name) {
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
   * @param  {Any}      id  Id of the document.
   * @return {Promise}      The document.
   */
  read(id) {
    return this.db.data.get(id);
  }

  /**
   * Save a document to the database.
   *
   * @param  {Object}   doc The document to be saved.
   * @return {Promise}      The document.
   */
  save(doc = {}) {
    return this.db.data.put(doc, doc._id);
  }

  /**
   * Delete a document from the database.
   *
   * @param  {Object}   doc The document to delete.
   * @return {Promise}      The document.
   */
  delete(doc = {}) {
    return this.db.data.delete(doc._id);
  }
}

export default Database;
