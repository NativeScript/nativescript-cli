(function() {
  
  /**
   * Executes a custom command.
   * 
   * @param {string} id The endpoint.
   * @param {Object} [args] Command arguments.
   * @param {Object} options Options.
   */
  Kinvey.execute = function(id, args, options) {
    var store = new Kinvey.Store.Rpc();
    store.execute(id, args, options);
  };
  
}());