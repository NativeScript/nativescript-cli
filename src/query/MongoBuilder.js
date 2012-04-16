(function() {

  // Define the Kinvey Query MongoBuilder class.
  Kinvey.Query.MongoBuilder = Base.extend({
    // Conditions.
    limit: null,
    skip: null,
    sort: null,
    query: null,

    /**
     * Creates a new MongoDB query builder.
     * 
     * @name Kinvey.Query.MongoBuilder
     * @constructor
     */
    constructor: function() {
      //
    },

    /** @lends Kinvey.Query.MongoBuilder# */

    /**
     * Adds condition.
     * 
     * @param {string} field Field.
     * @param {number} condition Condition.
     * @param {*} value Expression.
     * @throws {Error} On unsupported condition.
     */
    addCondition: function(field, condition, value) {
      switch(condition) {
        // Basic operators.
        // @see http://www.mongodb.org/display/DOCS/Advanced+Queries
        case Kinvey.Query.EQUAL:
          this._set(field, value);
          break;
        case Kinvey.Query.EXIST:
          this._set(field, { $exists: value });
          break;
        case Kinvey.Query.LESS_THAN:
          this._set(field, {$lt: value});
          break;
        case Kinvey.Query.LESS_THAN_EQUAL:
          this._set(field, {$lte: value});
          break;
        case Kinvey.Query.GREATER_THAN:
          this._set(field, {$gt: value});
          break;
        case Kinvey.Query.GREATER_THAN_EQUAL:
          this._set(field, {$gte: value});
          break;
        case Kinvey.Query.NOT_EQUAL:
          this._set(field, {$ne: value});
          break;

        // Geoqueries.
        // @see http://www.mongodb.org/display/DOCS/Geospatial+Indexing
        case Kinvey.Query.NEAR_SPHERE:
          var query = { $nearSphere: value.point };
          value.maxDistance && (query.$maxDistance = value.maxDistance);
          this._set(field, query);
          break;
        case Kinvey.Query.WITHIN_BOX:
          this._set(field, {$within: {$box: value}});
          break;
        case Kinvey.Query.WITHIN_CENTER_SPHERE:
          this._set(field, {$within: {$centerSphere: [value.center, value.radius] }});
          break;
        case Kinvey.Query.WITHIN_POLYGON:
          this._set(field, {$within: {$polygon: value}});
          break;

        // Set membership.
        // @see http://www.mongodb.org/display/DOCS/Advanced+Queries
        case Kinvey.Query.IN:
          this._set(field, {$in: value});
          break;
        case Kinvey.Query.NOT_IN:
          this._set(field, {$nin: value});
          break;

        // Joining operators.
        case Kinvey.Query.AND:
          if(!(value instanceof Kinvey.Query.MongoBuilder)) {
            throw new Error('Query must be of type Kinvey.Query.Mongobuilder');
          }
          this.query = { $and: [this.query || {}, value.query || {}] };
          break;
        case Kinvey.Query.OR:
          if(!(value instanceof Kinvey.Query.MongoBuilder)) {
            throw new Error('Query must be of type Kinvey.Query.Mongobuilder');
          }
          this.query = { $or: [this.query || {}, value.query || {}] };
          break;

        // Array operators.
        // @see http://www.mongodb.org/display/DOCS/Advanced+Queries
        case Kinvey.Query.ALL:
          this._set(field, {$all: value});
          break;
        case Kinvey.Query.SIZE:
          this._set(field, {$size: value});
          break;

        // Other operator.
        default:
          throw new Error('Condition ' + condition + ' is not supported');
      }
    },

    /**
     * Resets query.
     * 
     */
    reset: function() {
      this.query = null;
    },

    /**
     * Sets query limit.
     * 
     * @param {number} limit Limit, or null to reset limit.
     */
    setLimit: function(limit) {
      this.limit = limit;
    },

    /**
     * Sets query skip.
     * 
     * @param {number} skip Skip, or null to reset skip.
     */
    setSkip: function(skip) {
      this.skip = skip;
    },

    /**
     * Sets query sort.
     * 
     * @param {string} field Field.
     * @param {number} direction Sort direction, or null to reset sort.
     */
    setSort: function(field, direction) {
      if(null == direction) {
        this.sort = null;// hard reset
        return;
      }

      // Set sort value.
      var value = Kinvey.Query.ASC === direction ? 1 : -1;
      this.sort = {};// reset
      this.sort[field] = value;
    },

    /**
     * Returns JSON representation.
     * 
     * @return {Object} JSON representation.
     */
    toJSON: function() {
      var result = {};
      this.limit && (result.limit = this.limit);
      this.skip && (result.skip = this.skip);
      this.sort && (result.sort = this.sort);
      this.query && (result.query = this.query);
      return result;
    },

    /**
     * Helper function to add expression to field.
     * 
     * @private
     */
    _set: function(field, expression) {
      this.query || (this.query = {});
      if(!(expression instanceof Object)) {// simple condition
        this.query[field] = expression;
        return;
      }

      // Complex condition.
      this.query[field] instanceof Object || (this.query[field] = {});
      for(var operator in expression) {
        this.query[field][operator] = expression[operator];
      }
    }
  });

}());