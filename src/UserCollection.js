(function() {

  // Define the Kinvey UserCollection class.
  Kinvey.UserCollection = Kinvey.Collection.extend({
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
      Kinvey.Collection.prototype.constructor.call(this, 'user', query);
    },

    /** @lends Kinvey.UserCollection# */

    /**
     * Clears collection. This action is not allowed.
     * 
     * @override
     */
    clear: function(options) {
      var message = 'This request requires the master secret';
      options && options.error && options.error({
        error: message,
        message: message
      });
    }
  });

}());