(function(Kinvey) {

  /**
   * Creates new user collection
   * 
   * @example
   * 
   * <pre>
   * var collection = new Kinvey.UserCollection();
   * </pre>
   * 
   * @extends Kinvey.Collection
   * @constructor
   * @param {Kinvey.Query.SimpleQuery} [query] collection query
   */
  Kinvey.UserCollection = function(query) {
    // Call parent constructor, pass empty collection name.
    Kinvey.UserCollection._super.constructor.call(this, '', query);

    // Constants
    /**
     * @override
     * @private
     * @constant
     */
    this.API = Kinvey.Net.USER_API;
  };
  inherits(Kinvey.UserCollection, Kinvey.Collection);

  // Methods
  extend(Kinvey.UserCollection.prototype, {
    /** @lends Kinvey.UserCollection# */

    /**
     * @override
     * @see Kinvey.Collection#removeAll
     */
    removeAll: function(success, failure) {
      throw new Error('This request requires the master secret');
    },

    /**
     * @override
     * @private
     */
    _toEntity: function(map) {
      return new Kinvey.User(map);
    }
  });

}(Kinvey));