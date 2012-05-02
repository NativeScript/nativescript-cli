(function() {

  // Define the Kinvey Aggregation class.
  Kinvey.Aggregation = Base.extend({
    /**
     * Creates a new aggregation.
     * 
     * @example <code>
     * var aggregation = new Kinvey.Aggregation();
     * </code>
     * 
     * @name Kinvey.Aggregation
     * @constructor
     * @param {Object} [builder] One of Kinvey.Aggregation.* builders.
     */
    constructor: function(builder) {
      this.builder = builder || Kinvey.Aggregation.factory();
    },

    /** @lends Kinvey.Aggregation# */

    /**
     * Adds key under condition.
     * 
     * @param {string} key Key under condition.
     * @return {Kinvey.Aggregation} Current instance.
     */
    on: function(key) {
      this.builder.on(key);
      return this;
    },

    /**
     * Sets the finalize function. Currently not supported.
     * 
     * @param {function(counter)} fn Finalize function.
     * @return {Kinvey.Aggregation} Current instance.
     */
    setFinalize: function(fn) {
      this.builder.setFinalize(fn);
    },

    /**
     * Sets the initial counter object.
     * 
     * @param {Object} counter Counter object.
     * @return {Kinvey.Aggregation} Current instance.
     */
    setInitial: function(counter) {
      this.builder.setInitial(counter);
      return this;
    },

    /**
     * Sets query.
     * 
     * @param {Kinvey.Query} [query] query.
     * @throws {Error} On invalid instance.
     * @return {Kinvey.Aggregation} Current instance.
     */
    setQuery: function(query) {
      if(query && !(query instanceof Kinvey.Query)) {
        throw new Error('Query must be an instanceof Kinvey.Query');
      }
      this.builder.setQuery(query);
      return this;
    },

    /**
     * Sets the reduce function.
     * 
     * @param {function(doc, counter)} fn Reduce function.
     * @return {Kinvey.Aggregation} Current instance.
     */
    setReduce: function(fn) {
      this.builder.setReduce(fn);
      return this;
    },

    /**
     * Returns JSON representation.
     * 
     * @return {Object} JSON representation.
     */
    toJSON: function() {
      return this.builder.toJSON();
    }
  }, {
    /** @lends Kinvey.Aggregation */

    /**
     * Returns an aggregation builder.
     * 
     * @return {Object} One of Kinvey.Aggregation.* builders.
     */
    factory: function() {
      // Currently, only the Mongo builder is supported.
      return new Kinvey.Aggregation.MongoBuilder();
    }
  });

}());