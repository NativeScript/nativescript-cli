(function(Kinvey) {

  /**
   * Kinvey Net namespace definition. This namespace provides API and operation
   * constants to allow different net adapters. Net adapters are constained in
   * this namespace as well.
   * 
   * @namespace
   */
  Kinvey.Net = {
    // API Constants
    /**
     * AppData API
     * 
     * @constant
     */
    APPDATA_API: 'APPDATA',

    /**
     * User API
     * 
     * @constant
     */
    USER_API: 'USER',

    /**
     * Resource API
     * 
     * @constant
     */
    RESOURCE_API: 'RESOURCE',

    // API operation constants
    /**
     * Create operation
     * 
     * @constant
     */
    CREATE: 'CREATE',

    /**
     * Read operation
     * 
     * @constant
     */
    READ: 'READ',

    /**
     * Update operation
     * 
     * @constant
     */
    UPDATE: 'UPDATE',

    /**
     * Delete operation
     * 
     * @constant
     */
    DELETE: 'DELETE',

    // Methods
    /**
     * Returns net adapter
     * 
     * @example
     * 
     * <pre>
     * var net = Kinvey.Net.factory(Kinvey.Net.USER_API);
     * var net = Kinvey.Net.factory(Kinvey.Net.USER_API, 'user-id');
     * var net = Kinvey.Net.factory(Kinvey.Net.APPDATA_API, 'col-name');
     * var net = Kinvey.Net.factory(Kinvey.Net.APPDATA_API, 'col-name', 'entity-id');
     * </pre>
     * 
     * @param {string} api one of Kinvey.Net api constants
     * @param {string} [collection] collection name. Required when using AppData
     *          api.
     * @param {string} [id] entity id
     * @return {Object} one of Kinvey.Net.* adapters
     */
    factory: function(api, collection, id) {
      // Currently, only the HTTP net adapter is supported
      return new Kinvey.Net.Http(api, collection, id);
    }
  };

}(Kinvey));