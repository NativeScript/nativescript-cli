// Database.
// ---------

// To enable local persistence, application data must be physically stored on
// the device. The `Database` namespace exposes the API to do just that.

/**
 * @private
 * @namespace Database
 */
var Database = /** @lends Database */{
  /**
   * Saves multiple (new) documents.
   *
   * @abstract
   * @method
   * @param {string} collection The collection.
   * @param {Object[]} documents List of documents.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  batch: methodNotImplemented('Database.batch'),

  /**
   * Deletes all documents matching the provided query.
   * NOTE This method is not transaction-safe.
   *
   * @abstract
   * @method
   * @param {string} collection The collection.
   * @param {Kinvey.Query} [query] The query.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  clean: methodNotImplemented('Database.clean'),

  /**
   * Counts the number of documents matching the provided query.
   *
   * @abstract
   * @method
   * @param {string} collection The collection.
   * @param {Kinvey.Query} [query] The query.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  count: methodNotImplemented('Database.count'),

  /**
   * Deletes a document.
   *
   * @abstract
   * @method
   * @param {string} collection The collection.
   * @param {string} id The document id.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  destroy: methodNotImplemented('Database.destroy'),

  /**
   * Deletes the entire database.
   *
   * @abstract
   * @method
   * @returns {Promise} The response.
   */
  destruct: methodNotImplemented('Database.destruct'),

  /**
   * Retrieves all documents matching the provided query.
   *
   * @abstract
   * @method
   * @param {string} collection The collection.
   * @param {Kinvey.Query} [query] The query.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  find: methodNotImplemented('Database.find'),

  /**
   * Retrieves a document, and updates it within the same transaction.
   * NOTE This method must be transaction-safe.
   *
   * @abstract
   * @method
   * @param {string} collection The collection.
   * @param {Kinvey.Query} [query] The query.
   * @param {function} fn The update function.
   * @returns {Promise} The response.
   */
  findAndModify: methodNotImplemented('Database.findAndModify'),

  /**
   * Retrieves a document.
   *
   * @abstract
   * @method
   * @param {string} collection The collection.
   * @param {string} id The document id.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  get: methodNotImplemented('Database.get'),

  /**
   * Performs an aggregation.
   *
   * @abstract
   * @method
   * @param {string} collection The collection.
   * @param {Object} aggregation The aggregation object-literal.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  group: methodNotImplemented('Database.group'),

  /**
   * Saves a (new) document.
   *
   * @abstract
   * @method
   * @param {string} collection The collection.
   * @param {Object} document The document.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  save: methodNotImplemented('Database.save'),

  /**
   * Updates a document.
   *
   * @abstract
   * @method
   * @param {string} collection The collection.
   * @param {Object} document The document.
   * @param {Options} options Options.
   * @returns {Promise} The response.
   */
  update: methodNotImplemented('Database.update'),

  /**
   * Sets the implementation of `Database` to the specified adapter.
   *
   * @method
   * @param {Object} adapter Object implementing the `Database` interface.
   */
  use: use([
    'batch', 'clean', 'count', 'destroy', 'destruct', 'find', 'findAndModify',
    'get', 'group', 'save', 'update'
  ])
};