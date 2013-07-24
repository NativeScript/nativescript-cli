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

// Data Store.
// -----------

// Expose a `Kinvey.Backbone` model and collection mixin which can be used to
// extend Backbone’s model and collection. Mixins follow the
// [mixin](http://ricostacruz.com/backbone-patterns/#mixins) pattern.

// Define the model mixin. It preseeds the models’ `id`, as well as its `sync`
// function.

/**
 * @memberof! <global>
 * @mixin Kinvey.Backbone.ModelMixin
 * @borrows SyncMixin.sync as sync
 */
Kinvey.Backbone.ModelMixin = _.extend({}, SyncMixin, /** @lends Kinvey.Backbone.ModelMixin */{
  /**
   * The models’ unique key.
   * See [Backbone.js.](http://backbonejs.org/#Model-idAttribute).
   *
   * @default
   * @type {string}
   */
  idAttribute: '_id',

  /**
   * List of the models’ relations.
   *
   * @default
   * @type {Array}
   */
  relations: []
});

// Define the collection mixin. It preseeds the `sync`, and adds the
// aggregation and query related methods.

/**
 * @memberof! <global>
 * @mixin Kinvey.Backbone.CollectionMixin
 * @borrows SyncMixin.sync as sync
 */
Kinvey.Backbone.CollectionMixin = _.extend(
  {},
  SyncMixin,
  /** @lends Kinvey.Backbone.CollectionMixin */{
    /**
     * The collections’ query, applied to the clean and fetch methods.
     *
     * @type {Kinvey.Query}
     */
    query: null,

    /**
     * Cleans the collection.
     *
     * @param {Object} [options] Options.
     * @returns {Promise} The response, status, and xhr objects.
     */
    clean: function(options) {
      // Cast arguments.
      options       = options ? _.clone(options) : {};
      options.parse = 'undefined' === typeof options.parse ? true : options.parse;
      backboneWrapCallbacks(this, options);

      // Invoke the persistence layer.
      return this.sync('delete', this, options);
    },

    /**
     * Counts the number of documents in the collection.
     *
     * @param {Object} options Options.
     * @returns {Promise} The response, status, and xhr objects.
     */
    count: function(options) {
      // Cast arguments.
      options         = _.clone(options) || {};
      options.subject = this;// Used by the persistence layer.
      backboneWrapCallbacks(this, options, false);

      // Prepare the response.
      var collection = _.result(this, 'url');
      var query      = options.query || this.query;
      var promise;
      if(USERS === collection) {
        promise = Kinvey.User.count(query, options);
      }
      else {
        promise = Kinvey.DataStore.count(collection, query, options);
      }

      // Return the response.
      return kinveyToBackbonePromise(promise, options);
    },

    /**
     * Performs a group operation.
     *
     * @param {Kinvey.Aggregation} aggregation The aggregation.
     * @param {Object} options Options.
     * @returns {Promise} The response, status, and xhr objects.
     */
    group: function(aggregation, options) {
      // Cast arguments.
      options         = _.clone(options) || {};
      options.subject = this;// Used by the persistence layer.
      backboneWrapCallbacks(this, options, false);

      // Apply query.
      var query = options.query || this.query;
      if(null != query) {
        aggregation.query(query);
      }

      // Prepare the response.
      var collection = _.result(this, 'url');
      var promise;
      if(USERS === collection) {
        promise = Kinvey.User.group(aggregation, options);
      }
      else {
        promise = Kinvey.DataStore.group(collection, aggregation, options);
      }

      // Return the response.
      return kinveyToBackbonePromise(promise, options);
    }
  }
);