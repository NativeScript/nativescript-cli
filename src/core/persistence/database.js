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

  // Current version of database
  version: 1,

  // Name of database version table
  versionTable: 'KinveyDatabaseVersion',

  /**
   * Called internally by the library to upgrade any changes
   * made to the database schema on library updates.
   *
   * @return {Promise} Upgrade has completed
   */
  upgrade: function() {
    var logLevel = Kinvey.Log.getLevel();
    Kinvey.Log.disableAll();

    try {
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
      }).then(function() {
        Kinvey.Log.setLevel(logLevel);
        return;
      });
    } catch (err) {
      Kinvey.Log.setLevel(logLevel);
      // Catch unsupported database methods error and
      // just resolve
      return Kinvey.Defer.resolve();
    }
  },

  /**
   * Upgrades the database schema from the current version to the new
   * version.
   *
   * @param  {Number}  currentVersion Current version of the database
   * @param  {Number}  newVersion New version to upgrade database to
   * @return {Promise} Upgrade has compelted
   */
  onUpgrade: function(currentVersion, newVersion) {
    var deferred = Kinvey.Defer.deferred();
    var upgradeVersion = currentVersion == null ? 1 : currentVersion + 1;

    // Upgrade
    if (upgradeVersion <= newVersion) {
      // Add upgrades here...

      return Database.onUpgrade(upgradeVersion, newVersion);
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
   * Checks if an id was created offline as a temporary ID.
   *
   * @abstract
   * @method
   * @param {String} id The id.
   * @returns {Boolean} True or false if the id is a temporary ID.
   */
  isTemporaryObjectID: methodNotImplemented('Database.isTemporaryObjectID'),

  /**
   * Sets the implementation of `Database` to the specified adapter.
   *
   * @method
   * @param {Object} adapter Object implementing the `Database` interface.
   */
  use: use([
    'batch', 'clean', 'count', 'destroy', 'destruct', 'find', 'findAndModify',
    'get', 'group', 'save', 'update', 'isTemporaryObjectID'
  ])
};
