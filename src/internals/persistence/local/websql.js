/* jshint evil: true */

/**
 * `Database` adapter for [WebSql](http://dev.w3.org/html5/webdatabase/).
 *
 * @private
 * @namespace
 */
var WebSqlAdapter = {
  /**
   * The reference to an opened instance of Database.
   *
   * @type {Database}
   */
  db: null,

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
   * The database size (in bytes).
   *
   * @default
   * @type {integer}
   */
  size: 5 * 1024 * 1024,

  /**
   * Executes a series of queries within a transaction.
   *
   * @param {string}   collection    The collection.
   * @param {string|Array} query     The query, or list of queries.
   * @param {Array}    [parameters]  The query parameters.
   * @param {boolean}  [write=false] Request write access in addition to read.
   * @param {Object}   [options]     Options.
   * @returns {Promise} The query result.
   */
  transaction: function(collection, query, parameters, write/*, options*/) {
    // Validate preconditions.
    var error;
    if(null == collection || !/^[a-zA-Z0-9\-]{1,128}/.test(collection)) {
      error = clientError(Kinvey.Error.INVALID_IDENTIFIER, {
        description : 'The collection name has an invalid format.',
        debug       : 'The collection name may only contain alphanumeric characters and dashes.'
      });
      return Kinvey.Defer.reject(error);
    }
    var escapedCollection = '\'' + collection + '\'';
    var isMaster          = 'sqlite_master' === collection;
    var isMulti           = isArray(query);

    // Cast arguments.
    query   = isMulti ? query : [ [query, parameters] ];
    write   = write || false;

    // If there is a database handle, re-use it.
    if(null === WebSqlAdapter.db) {
      WebSqlAdapter.db = root.openDatabase(WebSqlAdapter.dbName(), '1.0', '', WebSqlAdapter.size);
    }

    // Prepare the response.
    var deferred = Kinvey.Defer.deferred();

    // Obtain a transaction handle.
    var responses = [];
    WebSqlAdapter.db[write ? 'transaction' : 'readTransaction'](function(tx) {
      // If `write`, create the collection if it does not exist yet.
      if(write && !isMaster) {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS ' + escapedCollection + ' ' +
          '(key BLOB PRIMARY KEY NOT NULL, value BLOB NOT NULL)'
        );
      }

      // Execute the queries.
      query.forEach(function(parts) {
        var sql = parts[0].replace('#{collection}', escapedCollection);

        // Debug.
        if(KINVEY_DEBUG) {
          log('Executing a query.', sql, parts[1]);
        }

        // Execute the query, and append the result to the response.
        tx.executeSql(sql, parts[1], function(_, resultSet) {
          // Append the result.
          var response = { rowCount: resultSet.rowsAffected, result: [] };
          if(resultSet.rows.length) {// Append the rows.
            for(var i = 0; i < resultSet.rows.length; i += 1) {
              var value    = resultSet.rows.item(i).value;
              var document = isMaster ? value : JSON.parse(value);
              response.result.push(document);
            }
          }
          responses.push(response);

          // Debug.
          if(KINVEY_DEBUG) {
            log('Executed the query.', sql, parts[1], response);
          }
        });
      });
    }, function(err) {
      // Debug.
      if(KINVEY_DEBUG) {
        log('Failed to execute the query.', err);
      }

      // Translate the error in case the collection does not exist.
      if(-1 !== err.message.indexOf('no such table')) {
        error = clientError(Kinvey.Error.COLLECTION_NOT_FOUND, {
          description : 'This collection not found for this app backend',
          debug       : { collection: collection }
        });
      }
      else {// Other errors.
        error = clientError(Kinvey.Error.DATABASE_ERROR, { debug: err.message });
      }

      // Return the rejection.
      deferred.reject(error);
    }, function() {
      // Return the response.
      deferred.resolve(isMulti ? responses : responses.shift());
    });

    // Return the promise.
    return deferred.promise;
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
      document._id = document._id || WebSqlAdapter.objectID();

      // Add the query for the document.
      queries.push([
        'REPLACE INTO #{collection} (key, value) VALUES (?, ?)',
        [ document._id, JSON.stringify(document) ]
      ]);

      // Return the document.
      return document;
    });

    // Prepare the response.
    var promise = WebSqlAdapter.transaction(collection, queries, null, true, options);

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

    // Obtain the documents to be deleted via `WebSqlAdapter.find`.
    return WebSqlAdapter.find(collection, query, options).then(function(documents) {
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
      var promise = WebSqlAdapter.transaction(collection, sql, parameters, true, options);

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

    // Forward to `WebSqlAdapter.find`, and return the response count.
    return WebSqlAdapter.find(collection, query, options).then(function(response) {
      return { count: response.length };
    });
  },

  /**
   * @augments {Database.destroy}
   */
  destroy: function(collection, id, options) {
    // Prepare the response.
    var promise = WebSqlAdapter.transaction(collection, [
      [ 'SELECT value FROM #{collection} WHERE key = ?', [ id ] ],
      [ 'DELETE       FROM #{collection} WHERE key = ?', [ id ] ]
    ], null, true, options);

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
  destruct: function(options) {
    // Obtain a list of all tables in the database.
    var query      = 'SELECT name AS value FROM #{collection} WHERE type = ?';
    var parameters = [ 'table' ];

    // Return the response.
    var promise = WebSqlAdapter.transaction('sqlite_master', query, parameters, false, options);
    return promise.then(function(response) {
      // If there are no tables, return.
      var tables = response.result;
      if(0 === tables.length) {
        return null;
      }

      // Drop all tables. Filter tables first to avoid attempting to delete
      // system tables (which will fail).
      var queries = tables.filter(function(table) {
        return (/^[a-zA-Z0-9\-]{1,128}/).test(table);
      }).map(function(table) {
        return [ 'DROP TABLE IF EXISTS \'' + table + '\'' ];
      });
      return WebSqlAdapter.transaction('sqlite_master', queries, null, true, options);
    }).then(function() {
      return null;
    });
  },

  /**
   * @augments {Database.find}
   */
  find: function(collection, query, options) {
    // Prepare the response.
    var sql     = 'SELECT value FROM #{collection}';
    var promise = WebSqlAdapter.transaction(collection, sql, [], false, options);

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
    }, function(error) {
      // If `COLLECTION_NOT_FOUND`, return the empty set.
      if(Kinvey.Error.COLLECTION_NOT_FOUND === error.name) {
        return [];
      }
      return Kinvey.Defer.reject(error);
    });
  },

  /**
   * @augments {Database.findAndModify}
   */
  findAndModify: function(collection, id, fn, options) {
    // Obtain the document to be modified via `WebSqlAdapter.get`.
    var promise = WebSqlAdapter.get(collection, id, options).then(null, function(error) {
      // If `ENTITY_NOT_FOUND`, use an empty object and continue.
      if(Kinvey.Error.ENTITY_NOT_FOUND === error.name) {
        return null;
      }
      return Kinvey.Defer.reject(error);
    });

    // Return the response.
    return promise.then(function(response) {
      // Apply change function and update the document via `WebSqlAdapter.save`.
      var document = fn(response);
      return WebSqlAdapter.save(collection, document, options);
    });
  },

  /**
   * @augments {Database.get}
   */
  get: function(collection, id, options) {
    // Prepare the response.
    var sql     = 'SELECT value FROM #{collection} WHERE key = ?';
    var promise = WebSqlAdapter.transaction(collection, sql, [ id ], false, options);

    // Return the response.
    return promise.then(function(response) {
      // Extract the documents.
      var documents = response.result;

      // If the document could not be found, throw an `ENTITY_NOT_FOUND` error.
      if(0 === documents.length) {
        var error = clientError(Kinvey.Error.ENTITY_NOT_FOUND, {
          description : 'This entity not found in the collection',
          debug       : { collection: collection, id: id }
        });
        return Kinvey.Defer.reject(error);
      }
      return documents[0];
    }, function(error) {
      // If `COLLECTION_NOT_FOUND`, convert to `ENTITY_NOT_FOUND`.
      if(Kinvey.Error.COLLECTION_NOT_FOUND === error.name) {
        error = clientError(Kinvey.Error.ENTITY_NOT_FOUND, {
          description : 'This entity not found in the collection',
          debug       : { collection: collection, id: id }
        });
      }
      return Kinvey.Defer.reject(error);
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
    return WebSqlAdapter.find(collection, query, options).then(function(documents) {
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
    document._id = document._id || WebSqlAdapter.objectID();

    // Build the query.
    var query      = 'REPLACE INTO #{collection} (key, value) VALUES (?, ?)';
    var parameters = [ document._id, JSON.stringify(document) ];

    // Prepare the response.
    var promise = WebSqlAdapter.transaction(collection, query, parameters, true, options);

    // Return the response.
    return promise.then(function() {
      return document;
    });
  },

  /**
   * @augments {Database.update}
   */
  update: function(collection, document, options) {
    // Forward to `WebSqlAdapter.save`.
    return WebSqlAdapter.save(collection, document, options);
  }
};

// Use WebSQL adapter.
if('undefined' !== typeof root.openDatabase && 'undefined' !== typeof root.sift) {
  Database.use(WebSqlAdapter);

  // Add `Kinvey.Query` operators not supported by `sift`.
  ['near', 'regex', 'within'].forEach(function(operator) {
    root.sift.useOperator(operator, function() {
      throw new Kinvey.Error(operator + ' query operator is not supported locally.');
    });
  });
}