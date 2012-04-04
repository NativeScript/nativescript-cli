(function(Kinvey) {

  /**
   * Kinvey Net namespace definition. This namespace provides API and operation
   * constants to allow different net adapters. Net adapters live in this
   * namespace as well.
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

    // API operation constants
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
     * Returns net adapter.
     * 
     * @example <code>
     * var net = Kinvey.Net.factory(Kinvey.Net.USER_API);
     * var net = Kinvey.Net.factory(Kinvey.Net.USER_API, 'user-id');
     * var net = Kinvey.Net.factory(Kinvey.Net.APPDATA_API, 'col-name');
     * var net = Kinvey.Net.factory(Kinvey.Net.APPDATA_API, 'col-name', 'entity-id');
     * </code>
     * 
     * @param {string} api One of Kinvey.Net api constants.
     * @param {string} [collection] Collection name. Required when using the AppData
     *          API.
     * @param {string} [id] Entity id.
     * @return {Object} One of Kinvey.Net.* adapters.
     */
    factory: function(api, collection, id) {
      // Currently, only the XMLHttpRequest adapter is supported.
      return new Kinvey.Net.Xhr(api, collection, id);
    }
  };

}(Kinvey));