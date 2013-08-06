/**
 * Copyright 2013 Kinvey, Inc.
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

/* jshint evil: true */

// `Database` adapter for Titaniums’
// [Database](http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.Database).
// This works for native platforms only, mobileweb can *not* use this.
var TiDatabaseAdapter = {
  /**
   * Returns the database name.
   *
   * @throws {Kinvey.Error} `Kinvey.appKey` must not be `null`.
   * @returns {string} The database name.
   */
  dbName: function() {
    // Validate preconditions.
    if(null == Kinvey.appKey) {
      throw new Kinvey.Error('Kinvey.appKey must not be null.');
    }
    return 'Kinvey.' + Kinvey.appKey;
  },

  /**
   * Executes a query.
   *
   * @param {string} collection The table name.
   * @param {string|Array} query The query, or list of queries.
   * @param {Array} [parameters] The query parameters.
   * @param {Object} options Options.
   * @param {function} [options.progress] Progress function, invoked after
   *                     each query in `query`.
   * @returns {Promise} The query result.
   */
  execute: function(collection, query, parameters, options) {
    // Validate preconditions.
    if(!isString(collection) || !/^[a-zA-Z0-9\-]{1,128}/.test(collection)) {
      var error = clientError(Kinvey.Error.INVALID_IDENTIFIER, {
        description : 'The collection name has an invalid format.',
        debug       : 'The collection name must be a string containing only ' +
         'alphanumeric characters and dashes, "' + collection + '" given.'
      });
      return Kinvey.Defer.reject(error);
    }
    var escapedCollection = '\'' + collection + '\'';
    var isMulti           = isArray(query);

    // Cast arguments.
    options = options || {};
    query   = isMulti ? query : [ [ query, parameters ] ];

    // Obtain a database handle. Any exceptions thrown will be converted into
    // an error object.
    try {
      var db = Titanium.Database.open(TiDatabaseAdapter.dbName());
      db.execute('BEGIN TRANSACTION');// Start a transaction.

      // Create the collection if it does not exist yet.
      db.execute(
        'CREATE TABLE IF NOT EXISTS ' + escapedCollection + ' ' +
        '(key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)'
      );

      // Execute the queries.
      var response = query.map(function(parts) {
        var sql = parts[0].replace('#{collection}', escapedCollection);

        // Debug.
        if(KINVEY_DEBUG) {
          log('Executing a query.', sql, parts[1]);
        }

        // Prepare the response.
        var res = db.execute(sql, parts[1]);
        var response = { rowCount: db.getRowsAffected(), result: null };

        // Add the result if the result set is available.
        if(null != res) {
          response.result = [];
          while(res.isValidRow()) {
            var document = JSON.parse(res.fieldByName('value'));
            response.result.push(document);
            res.next();// Proceed.
          }
          res.close();
        }

        // If `options.progress`, notify observer of progress.
        if(null != options.progress) {
          options.progress(collection, response, query);
        }

        // Debug.
        if(KINVEY_DEBUG) {
          log('Executed the query.', response);
        }

        // Return the response.
        return response;
      });

      // Commit the transaction.
      db.execute('COMMIT TRANSACTION');

      // Close the database.
      db.close();

      // Return the response.
      return Kinvey.Defer.resolve(isMulti ? response : response.shift());
    }
    catch(e) {// Low-level database error.
      // Debug.
      if(KINVEY_DEBUG) {
        log('Failed to execute the query.', e.message);
      }

      // Return the rejection.
      var error = clientError(Kinvey.Error.DATABASE_ERROR, { debug: e.message });
      return Kinvey.Defer.reject(error);
    }
  },

  /**
   * Generates an object id.
   *
   * @param {integer} [length=24] The length of the object id.
   * @returns {string} The id.
   */
  objectID: function(length) {
    length = length || 24;
    var chars  = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for(var i = 0, j = chars.length; i < length; i += 1) {
      var pos = Math.floor(Math.random() * j);
      result += chars.substring(pos, pos + 1);
    }
    return result;
  },

  /**
   * @augments {Database.batch}
   */
  batch: function(collection, documents, options) {
    // If there are no documents, return.
    if(0 === documents.length) {
      return Kinvey.Defer.resolve(documents);
    }

    // Build the queries.
    var queries = [];
    documents = documents.map(function(document) {
      // Cast arguments.
      document._id = document._id || TiDatabaseAdapter.objectID();

      // Add the query for the document.
      queries.push([
        'INSERT OR REPLACE INTO #{collection} (key, value) VALUES (?, ?)',
        [ document._id, JSON.stringify(document) ]
      ]);

      // Return the document.
      return document;
    });

    // Prepare the response.
    var promise = TiDatabaseAdapter.execute(collection, queries, null, options);

    // Return the response.
    return promise.then(function() {
      return documents;
    });
  },

  /**
   * @augments {Database.clean}
   */
  clean: function(collection, query, options) {
    // Deleting should not take the query sort, limit, and skip into account.
    if(null != query) {// Reset.
      query.sort(null).limit(null).skip(0);
    }

    // Obtain the documents to be deleted via `TiDatabaseAdapter.find`.
    return TiDatabaseAdapter.find(collection, query, options).then(function(documents) {
      // If there are no documents matching the query, return.
      if(0 === documents.length) {
        return { count: 0, documents: [] };
      }

      // Build the query.
      var infix      = [];
      var parameters = documents.map(function(document) {
        infix.push('?');// Add placeholder.
        return document._id;
      });
      var sql = 'DELETE FROM #{collection} WHERE key IN(' + infix.join(',') + ')';

      // Prepare the response.
      var promise = TiDatabaseAdapter.execute(collection, sql, parameters, options);

      // Return the response.
      return promise.then(function(response) {
        return { count: response.rowCount, documents: documents };
      });
    });
  },

  /**
   * @augments {Database.count}
   */
  count: function(collection, query, options) {
    // Counting should not take the query sort, limit, and skip into account.
    if(null != query) {// Reset.
      query.sort(null).limit(null).skip(0);
    }

    // Forward to `TiDatabaseAdapter.find`, and return the response count.
    return TiDatabaseAdapter.find(collection, query, options).then(function(response) {
      return { count: response.length };
    });
  },

  /**
   * @augments {Database.destroy}
   */
  destroy: function(collection, id, options) {
    // Prepare the response.
    var promise = TiDatabaseAdapter.execute(collection, [
      [ 'SELECT value FROM #{collection} WHERE key = ?', [ id ] ],
      [ 'DELETE       FROM #{collection} WHERE key = ?', [ id ] ]
    ], null, options);

    // Return the response.
    return promise.then(function(response) {
      // Extract the response.
      var count     = response[1].rowCount;
      var documents = response[0].result;

      // If the document could not be found, throw an `ENTITY_NOT_FOUND` error.
      if(0 === count) {
        var error = clientError(Kinvey.Error.ENTITY_NOT_FOUND, {
          description : 'This entity not found in the collection',
          debug       : { collection: collection, id: id }
        });
        return Kinvey.Defer.reject(error);
      }

      // Return the count and the deleted document.
      return { count: count, documents: documents };
    });
  },

  /**
   * @augments {Database.destruct}
   */
  destruct: function(/*options*/) {
    // Validate preconditions.
    var error;
    if(null == Kinvey.appKey) {
      error = clientError(Kinvey.Error.MISSING_APP_CREDENTIALS);
      return Kinvey.Defer.reject(error);
    }

    // Obtain a database handle. Any exceptions thrown will be converted into
    // an error object.
    try {
      var db = Titanium.Database.open(TiDatabaseAdapter.dbName());

      // Delete the entire database. The exact mechanism used differs between
      // Android and iOS.
      if(db.remove) {// Android.
        db.remove();
        return Kinvey.Defer.resolve(null);
      }
      if(db.file && db.file.deleteFile()) {// iOS.
        return Kinvey.Defer.resolve(null);
      }

      // The mechanisms to delete the database is not implemented for this
      // platform.
      error = clientError(Kinvey.Error.DATABASE_ERROR, {
        debug: 'The mechanism to delete the database is not implemented for this platform.'
      });
      return Kinvey.Defer.reject(error);
    }
    catch(e) {// Low-level database error.
      error = clientError(Kinvey.Error.DATABASE_ERROR, { debug: e.message });
      return Kinvey.Defer.reject(error);
    }
  },

  /**
   * @augments {Database.find}
   */
  find: function(collection, query, options) {
    // Prepare the response.
    var sql     = 'SELECT value FROM #{collection}';
    var promise = TiDatabaseAdapter.execute(collection, sql, [], options);

    // Return the response.
    return promise.then(function(response) {
      response = response.result;// The documents.

      // Apply the query.
      if(null == query) {
        return response;
      }

      // Filters.
      response = root.sift(query.toJSON().filter, response);

      // Post process.
      return query._postProcess(response);
    });
  },

  /**
   * @augments {Database.findAndModify}
   */
  findAndModify: function(collection, id, fn, options) {
    // Cast arguments.
    options = options || {};

    // Use the `progress` option to change the document between queries.
    var document = null;
    options.progress = function(collection, response, query) {
      document = fn(response.result[0] || null);// Apply change function.

      // Set the correct upsert query parameter.
      query[1][1][1] = JSON.stringify(document);
      delete options.progress;// Run only once.
    };

    // Prepare the response. The second upsert query parameter will be
    // overwritten by the `progress` function above. If this fails for some
    // reason, a NULL constraint violation will be thrown.
    var promise = TiDatabaseAdapter.execute(collection, [
      [ 'SELECT value FROM #{collection} WHERE key = ?', [ id ] ],
      [ 'INSERT OR REPLACE INTO #{collection} (key, value) VALUES (?, ?)', [ id, null ] ]
    ], null, options);

    // Return the response.
    return promise.then(function() {
      return document;
    });
  },

  /**
   * @augments {Database.get}
   */
  get: function(collection, id, options) {
    // Prepare the response.
    var sql     = 'SELECT value FROM #{collection} WHERE key = ?';
    var promise = TiDatabaseAdapter.execute(collection, sql, [ id ], options);

    // Return the response.
    return promise.then(function(response) {
      // Extract the documents.
      var documents = response.result || [];

      // If the document could not be found, throw an `ENTITY_NOT_FOUND` error.
      if(0 === documents.length) {
        var error = clientError(Kinvey.Error.ENTITY_NOT_FOUND, {
          description : 'This entity not found in the collection',
          debug       : { collection: collection, id: id }
        });
        return Kinvey.Defer.reject(error);
      }
      return documents[0];
    });
  },

  /**
   * @augments {Database.group}
   */
  group: function(collection, aggregation, options) {
    // Cast arguments. This casts the reduce string to reduce function.
    var reduce = aggregation.reduce.replace(/function[\s\S]*?\([\s\S]*?\)/, '');
    aggregation.reduce = new Function(['doc', 'out'], reduce);

    // Obtain documents subject to aggregation.
    var query = new Kinvey.Query({ filter: aggregation.condition });
    return TiDatabaseAdapter.find(collection, query, options).then(function(documents) {
      // Prepare the grouping.
      var groups = {};

      // Segment documents into groups.
      documents.forEach(function(document) {
        // Determine the group the document belongs to.
        // NOTE Dot-separated (nested) fields are not supported.
        var group = {};
        for(var name in aggregation.key) {
          if(aggregation.key.hasOwnProperty(name)) {
            group[name] = document[name];
          }
        }

        // Initialize the group (if not done yet).
        var key = JSON.stringify(group);
        if(null == groups[key]) {
          groups[key] = group;
          for(var attr in aggregation.initial) {// Add initial attributes.
            if(aggregation.initial.hasOwnProperty(attr)) {
              groups[key][attr] = aggregation.initial[attr];
            }
          }
        }

        // Run the reduce function on the group and document.
        aggregation.reduce(document, groups[key]);
      });

      // Cast the groups to the response.
      var response = [];
      for(var segment in groups) {
        if(groups.hasOwnProperty(segment)) {
          response.push(groups[segment]);
        }
      }
      return response;
    });
  },

  /**
   * @augments {Database.save}
   */
  save: function(collection, document, options) {
    // Cast arguments.
    document._id = document._id || TiDatabaseAdapter.objectID();

    // Build the query.
    var query      = 'INSERT OR REPLACE INTO #{collection} (key, value) VALUES(?, ?)';
    var parameters = [ document._id, JSON.stringify(document) ];

    // Prepare the response.
    var promise = TiDatabaseAdapter.execute(collection, query, parameters, options);

    // Return the response.
    return promise.then(function() {
      return document;
    });
  },

  /**
   * @augments {Database.update}
   */
  update: function(collection, document, options) {
    // Forward to `TiDatabaseAdapter.save`.
    return TiDatabaseAdapter.save(collection, document, options);
  }
};

// Apply the adapter.
if('undefined' !== typeof Titanium.Database && 'undefined' !== typeof root.sift) {
  Database.use(TiDatabaseAdapter);

  // Add `Kinvey.Query` operators not supported by `sift`.
  ['near', 'regex', 'within'].forEach(function(operator) {
    root.sift.useOperator(operator, function() {
      throw new Kinvey.Error(operator + ' query operator is not supported locally.');
    });
  });
}