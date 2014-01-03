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

// Export.

// Extend Backbone model and collection to provide built-in models and
// collections for entities and users. Even though the user model and
// collection are close to the entity model and collection mixins, no
// no inheritance is applied:
// Kinvey.Backbone.User is not an instance of Kinvey.Backbone.Model.

// By default, extend `Backbone.Model`. However, for better integration with
// references, use `Backbone.AssociatedModel` instead if it is available.
var backboneModel;
if('undefined' !== typeof Backbone.AssociatedModel ){
  backboneModel = Backbone.AssociatedModel;
}
else {
  backboneModel = Backbone.Model;
}

// Define the `Kinvey.Backbone` classes.

/**
 * The Kinvey.Backbone.Model class.
 *
 * @memberof! <global>
 * @class Kinvey.Backbone.Model
 * @extends Backbone.Model
 * @mixes Kinvey.Backbone.ModelMixin
 */
Kinvey.Backbone.Model = backboneModel.extend(Kinvey.Backbone.ModelMixin);

/**
 * The Kinvey.Backbone.Collection class.
 *
 * @memberof! <global>
 * @class Kinvey.Backbone.Collection
 * @extends Backbone.Collection
 * @mixes Kinvey.Backbone.CollectionMixin
 */
Kinvey.Backbone.Collection = Backbone.Collection.extend(
  // The mixin does not have access to the parent class, therefore the
  // functionality below is only available on `Kinvey.Backbone.Collection`.
  _.extend({}, Kinvey.Backbone.CollectionMixin, /** @lends Kinvey.Backbone.Collection# */{
    /**
     * The model class that the collection contains.
     * See [Backbone.js](http://backbonejs.org/#Collection-model).
     *
     * @default
     * @type {Kinvey.Backbone.Model}
     */
    model: Kinvey.Backbone.Model,

    /**
     * Initializes the collection.
     * See [Backbone.js](http://backbonejs.org/#Collection-constructor).
     *
     * @param {Array} [models] List of models.
     * @param {Object} [options] Options.
     * @param {Kinvey.Query} [options.query] The collection query.
     * @throws {Kinvey.Error} `options.query` must be of type: `Kinvey.Query`.
     */
    initialize: function(models, options) {
      // Call parent.
      var result = Backbone.Collection.prototype.initialize.apply(this, arguments);

      // Cast arguments.
      options = options || {};

      // Validate arguments.
      if(null != options.query && !(options.query instanceof Kinvey.Query)) {
        throw new Kinvey.Error('options.query argument must be of type: Kinvey.Query.');
      }
      this.query = options.query;

      // Return the parent’s response.
      return result;
    }
  })
);


// Define the `Kinvey.Backbone` classes.

/**
 * The Kinvey.Backbone.User class.
 *
 * @memberof! <global>
 * @class Kinvey.Backbone.User
 * @extends Backbone.Model
 * @mixes Kinvey.Backbone.UserMixin
 */
Kinvey.Backbone.User = backboneModel.extend(
  Kinvey.Backbone.UserMixin,// Class properties.
  Kinvey.Backbone.StaticUserMixin// Static properties.
);

/**
 * The Kinvey.Backbone.UserCollection class.
 *
 * @memberof! <global>
 * @class Kinvey.Backbone.UserCollection
 * @extends Backbone.Collection
 * @mixes Kinvey.Backbone.UserCollectionMixin
 */
Kinvey.Backbone.UserCollection = Backbone.Collection.extend(
  // The mixin does not have access to the parent class, therefore the
  // functionality below is only available on `Kinvey.Backbone.UserCollection`.
  _.extend({}, Kinvey.Backbone.UserCollectionMixin, /** @lends Kinvey.Backbone.UserCollection# */{
    /**
     * The model class that the collection contains.
     * See [Backbone.js](http://backbonejs.org/#Collection-model).
     *
     * @default
     * @type {Kinvey.Backbone.User}
     */
    model: Kinvey.Backbone.User,

    /**
     * Initializes the collection.
     * See [Backbone.js](http://backbonejs.org/#Collection-constructor).
     * NOTE `initialize` is identical for both the entity and user collection.
     *
     * @method
     * @param {Array} [models] List of users.
     * @param {Object} [options] Options.
     * @param {Kinvey.Query} [options.query] The collection query.
     * @throws {Kinvey.Error} `options.query` must be of type: `Kinvey.Query`.
     */
    initialize: Kinvey.Backbone.Collection.prototype.initialize
  })
);