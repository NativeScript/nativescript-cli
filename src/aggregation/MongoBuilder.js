(function() {

  // Define the Kinvey Aggregation MongoBuilder class.
  Kinvey.Aggregation.MongoBuilder = Base.extend({
    // Fields.
    finalize: function() { },
    initial: { count: 0 },
    keys: null,
    reduce: function(doc, out) {
      out.count++;
    },
    query: null,

    /**
     * Creates a new MongoDB aggregation builder.
     * 
     * @name Kinvey.Aggregation.MongoBuilder
     * @constructor
     */
    constructor: function() {
      // Set keys property explicitly on this instance, otherwise the prototype
      // will be overloaded.
      this.keys = {};
    },

    /** @lends Kinvey.Aggregation.MongoBuilder# */

    /**
     * Adds key under condition.
     * 
     * @param {string} key Key under condition.
     * @return {Kinvey.Aggregation} Current instance.
     */
    on: function(key) {
      this.keys[key] = true;
    },

    /**
     * Sets the finalize function.
     * 
     * @param {function(counter)} fn Finalize function.
     */
    setFinalize: function(fn) {
      this.finalize = fn;
    },

    /**
     * Sets the initial counter object.
     * 
     * @param {Object} counter Counter object.
     */
    setInitial: function(counter) {
      this.initial = counter;
    },

    /**
     * Sets query.
     * 
     * @param {Kinvey.Query} [query] query.
     */
    setQuery: function(query) {
      this.query = query;
      return this;
    },

    /**
     * Sets the reduce function.
     * 
     * @param {function(doc, out)} fn Reduce function.
     */
    setReduce: function(fn) {
      this.reduce = fn;
    },

    /**
     * Returns JSON representation.
     * 
     * @return {Object} JSON representation.
     */
    toJSON: function() {
      // Required fields.
      var result = {
        finalize: this.finalize.toString(),
        initial: this.initial,
        key: this.keys,
        reduce: this.reduce.toString()
      };

      // Optional fields.
      var query = this.query && this.query.toJSON().query;
      query && (result.condition = query);

      return result;
    }
  });

}());