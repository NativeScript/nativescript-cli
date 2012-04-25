(function() {

  // Define the Kinvey UserCollection class.
  Kinvey.UserCollection = Kinvey.Collection.extend({
    // Associated Kinvey API.
    API: Kinvey.Net.USER_API,

    // Mapped entity class.
    entity: Kinvey.User,

    /**
     * Creates new user collection.
     * 
     * @example <code>
     * var collection = new Kinvey.UserCollection();
     * </code>
     * 
     * @name Kinvey.UserCollection
     * @constructor
     * @extends Kinvey.Collection
     * @param {Kinvey.Query} [query] Query.
     */
    constructor: function(query) {
      // Users reside in a distinct API, without the notion of collections.
      // Therefore, an empty string is passed to the parent constructor.
      Kinvey.Collection.prototype.constructor.call(this, '', query);
    },

    /** @lends Kinvey.UserCollection# */

    /**
     * Clears collection. This action is not allowed.
     * 
     * @override
     */
    clear: function(options) {
      options && options.error && options.error({
        error: 'This request requires the master secret'
      });
    }
  });

}());