(function() {

  /**
   * Kinvey Net namespace definition. This namespace provides API and operation
   * constants to allow different network adapters. Network adapters live in
   * this namespace as well.
   * 
   * @namespace
   */
  Kinvey.Net = {
    // API Constants
    /**
     * AppData API.
     * 
     * @constant
     */
    APPDATA_API: 'APPDATA',

    /**
     * User API.
     * 
     * @constant
     */
    USER_API: 'USER',

    /**
     * Resource API.
     * 
     * @constant
     */
    RESOURCE_API: 'RESOURCE',

    // CRUD operation constants
    /**
     * Create operation.
     * 
     * @constant
     */
    CREATE: 'CREATE',

    /**
     * Read operation.
     * 
     * @constant
     */
    READ: 'READ',

    /**
     * Update operation.
     * 
     * @constant
     */
    UPDATE: 'UPDATE',

    /**
     * Delete operation.
     * 
     * @constant
     */
    DELETE: 'DELETE',

    // Methods
    /**
     * Returns a network adapter.
     * 
     * @example <code>
     * var net = Kinvey.Net.factory(Kinvey.Net.USER_API);
     * var net = Kinvey.Net.factory(Kinvey.Net.USER_API, 'user-id');
     * var net = Kinvey.Net.factory(Kinvey.Net.APPDATA_API, 'my-collection');
     * var net = Kinvey.Net.factory(Kinvey.Net.APPDATA_API, 'my-collection', 'entity-id');
     * </code>
     * 
     * @param {string} api One of Kinvey.Net API constants.
     * @param {string} [collection] Collection name. Required when using the
     *          AppData API.
     * @param {string} [id] Entity id.
     * @return {Object} One of Kinvey.Net.* adapters.
     */
    factory: function(api, collection, id) {
      if('undefined' !== typeof exports) {// node.js
        return new Kinvey.Net.Node(api, collection, id);
      }
      if(Kinvey.local) {
        return new Kinvey.Net.Sync(api, collection, id);
      }
      return new Kinvey.Net.Http(api, collection, id);
    }
  };

}());