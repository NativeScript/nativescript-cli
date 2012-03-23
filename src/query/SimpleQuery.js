(function(Kinvey) {

  /**
   * Creates new SimpleQuery
   * 
   * @constructor
   */
  Kinvey.Query.SimpleQuery = function() {
    // Properties
    /**
     * Query builder
     * 
     * @private
     * @type Kinvey.Query.JsonQueryBuilder
     */
    this.builder = new Kinvey.Query.JsonQueryBuilder();
  };

  // Methods
  extend(Kinvey.Query.SimpleQuery.prototype, {
    /** @lends Kinvey.Query.SimpleQuery# */

    /**
     * Adds criteria to query builder
     * 
     * @param {string} property property name
     * @param {string} operator one of Kinvey.Query operator constants
     * @param {*} value property value
     * @throws {Error} on invalid operator
     */
    addCriteria: function(property, operator, value) {
      // Map operator to builder method
      switch(operator) {
        case Kinvey.Query.ALL:
          this.builder.put(property).all(value);
          break;
        case Kinvey.Query.CONTAINS:
          this.builder.put(property).contains(value);
          break;
        case Kinvey.Query.EQUAL:
        case Kinvey.Query.IS:
          this.builder.put(property).is(value);
          break;
        case Kinvey.Query.EXISTS:
          this.builder.put(property).exists(value);
          break;
        case Kinvey.Query.GREATER_THAN:
          this.builder.put(property).greaterThan(value);
          break;
        case Kinvey.Query.GREATER_THAN_OR_EQUAL:
          this.builder.put(property).greaterThanEquals(value);
          break;
        case Kinvey.Query.LESS_THAN:
          this.builder.put(property).lessThan(value);
          break;
        case Kinvey.Query.LESS_THAN_OR_EQUAL:
          this.builder.put(property).lessThanEquals(value);
          break;
        case Kinvey.Query.NEAR:
          this.builder.put(property).near(value);
          break;
        case Kinvey.Query.NOT_EQUAL:
          this.builder.put(property).notEquals(value);
          break;
        case Kinvey.Query.NOT_IN:
          this.builder.put(property).notIn(value);
          break;
        case Kinvey.Query.SIZE:
          this.builder.put(property).size(value);
          break;
        case Kinvey.Query.WITHIN:
          this.builder.put(property).within(value);
          break;
        default:
          throw new Error('Operator ' + operator + ' not supported');
      }
    },

    /**
     * Clears all query criteria
     * 
     */
    clear: function() {
      this.builder.clear();
    },

    /**
     * Returns built query map
     * 
     * @return {Object} query map
     */
    get: function() {
      return this.builder.get();
    }
  });

}(Kinvey));