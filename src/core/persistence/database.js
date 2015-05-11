/**
 * Copyright 2014 Kinvey, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Database.
// ---------

// To enable local persistence, application data must be physically stored on
// the device. The `Database` namespace exposes the API to do just that.

/**
 * @private
 * @namespace Database
 */
var Database = /** @lends Database */{

  version: 1,
  versionTable: 'KINVEY_DATABASE_VERSION',

  upgrade: function() {
    // Read the existing version of the database
    return Database.find(Database.versionTable).then(null, function() {
      return [undefined];
    }).then(function(versions) {
      var doc = versions[0] || {};
      return Database.onUpgrade(doc.version, Database.version).then(function() {
        return doc;
      });
    }).then(function(doc) {
      // Update the version doc
      doc.version = Database.version;

      // Save the version doc
      return Database.save(Database.versionTable, doc);
    });
  },

  onUpgrade: function(oldVersion, newVersion) {
    var deferred = Kinvey.Defer.deferred();
    var upgradeVersion = oldVersion == null ? 1 : oldVersion;

    // Loop until old version equals new version
    while (upgradeVersion <= newVersion) {
      // if (upgradeVersion === 1) {
      //   // Do upgrades for version 1
      // }
      // else if (upgradeVersion === 2) {
      //   // Do upgrades for version 2
      // }

      // Add 1 to upgrade version
      upgradeVersion += 1;
    }

    deferred.resolve();
    return deferred.promise;
  },

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
