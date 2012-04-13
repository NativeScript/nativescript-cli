(function() {

  // Define the Kinvey Query class.
  Kinvey.Query = Base.extend({
    // Key under condition.
    currentKey: null,

    /**
     * Creates a new query.
     * 
     * @name Kinvey.Query
     * @constructor
     * @param {Object} [builder] One of Kinvey.Query.* builders.
     */
    constructor: function(builder) {
      this.builder = builder || Kinvey.Query.factory();
    },

    /** @lends Kinvey.Query# */

    /**
     * Sets all condition.
     * 
     * @param {Array} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    all: function(value) {
      this._set(Kinvey.Query.ALL, value);
      return this;
    },

    /**
     * Sets equal condition.
     * 
     * @param {*} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    equal: function(value) {
      this._set(Kinvey.Query.EQUAL, value);
      return this;
    },

    /**
     * Sets exist condition.
     * 
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    exist: function() {
      this._set(Kinvey.Query.EXIST, null);
      return this;
    },

    /**
     * Sets greater than condition.
     * 
     * @param {*} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    greaterThan: function(value) {
      this._set(Kinvey.Query.GREATER_THAN, value);
      return this;
    },

    /**
     * Sets greater than equal condition.
     * 
     * @param {*} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    greaterThanEqual: function(value) {
      this._set(Kinvey.Query.GREATER_THAN_EQUAL, value);
      return this;
    },

    /**
     * Sets in condition. Method has underscore postfix since "in" is a reserved
     * word.
     * 
     * @param {Array} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    in_: function(value) {
      this._set(Kinvey.Query.IN, value);
      return this;
    },

    /**
     * Sets less than condition.
     * 
     * @param {*} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    lessThan: function(value) {
      this._set(Kinvey.Query.LESS_THAN, value);
      return this;
    },

    /**
     * Sets less than equal condition.
     * 
     * @param {*} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    lessThanEqual: function(value) {
      this._set(Kinvey.Query.LESS_THAN_EQUAL, value);
      return this;
    },

    /**
     * Sets near sphere condition.
     * 
     * @param {Array} value Expression.
     * @param {number} [maxDistance] Max distance expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    nearSphere: function(value, maxDistance) {
      this._set(Kinvey.Query.NEAR_SPHERE, {
        point: value,
        maxDistance: maxDistance
      });
      return this;
    },

    /**
     * Sets not equal condition.
     * 
     * @param {*} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    notEqual: function(value) {
      this._set(Kinvey.Query.NOT_EQUAL, value);
      return this;
    },

    /**
     * Sets not in condition.
     * 
     * @param {Array} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    notIn: function(value) {
      this._set(Kinvey.Query.NOT_IN, value);
      return this;
    },

    /**
     * Sets key under condition.
     * 
     * @param {string} key Key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    on: function(key) {
      this.currentKey = key;
      return this;
    },

    /**
     * Sets query limit.
     * 
     * @param {number} limit Limit.
     * @return {Kinvey.Query} Current instance.
     */
    setLimit: function(limit) {
      this.builder.setLimit(limit);
      return this;
    },

    /**
     * Sets query skip.
     * 
     * @param {number} skip Skip.
     * @return {Kinvey.Query} Current instance.
     */
    setSkip: function(skip) {
      this.builder.setSkip(skip);
      return this;
    },

    /**
     * Sets size condition.
     * 
     * @param {number} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    size: function(value) {
      this._set(Kinvey.Query.SIZE, value);
      return this;
    },

    /**
     * Sets query sort.
     * 
     * @param {number} [direction] Sort direction.
     * @return {Kinvey.Query} Current instance.
     */
    sort: function(direction) {
      this.builder.setSort(this.currentKey, direction || Kinvey.Query.ASC);
      return this;
    },

    /**
     * Returns JSON representation.
     * 
     * @return {Object} JSON representation.
     */
    toJSON: function() {
      return this.builder.toJSON();
    },

    /**
     * Sets within box condition.
     * 
     * @param {Array} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    withinBox: function(value) {
      this._set(Kinvey.Query.WITHIN_BOX, value);
      return this;
    },

    /**
     * Sets within center sphere condition.
     * 
     * @param {Array} center Expression.
     * @param {number} radius Radius.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    withinCenterSphere: function(center, radius) {
      this._set(Kinvey.Query.WITHIN_CENTER_SPHERE, {
        center: center,
        radius: radius
      });
      return this;
    },

    /**
     * Sets within polygon condition.
     * 
     * @param {Array} value Expression.
     * @throws {Error} When there is no key under condition.
     * @return {Kinvey.Query} Current instance.
     */
    withinPolygon: function(value) {
      this._set(Kinvey.Query.WITHIN_POLYGON, value);
      return this;
    },

    /**
     * Helper function to forward condition to builder.
     * 
     * @private
     * @throws {Error} When there is no key under condition.
     */
    _set: function(operator, value) {
      if(null === this.currentKey) {
        throw new Error('Key under condition must not be null');
      }
      this.builder.addCondition(this.currentKey, operator, value);
    }
  }, {
    /** @lends Kinvey.Query */

    // Basic operators.
    /**
     * Equal operator. Checks if an element equals the specified expression.
     * 
     * @constant
     */
    EQUAL: 16,

    /**
     * Exist operator. Checks if an element exists.
     * 
     * @constant
     */
    EXIST: 17,

    /**
     * Less than operator. Checks if an element is less than the specified
     * expression.
     * 
     * @constant
     */
    LESS_THAN: 18,

    /**
     * Less than or equal to operator. Checks if an element is less than or
     * equal to the specified expression.
     * 
     * @constant
     */
    LESS_THAN_EQUAL: 19,

    /**
     * Greater than operator. Checks if an element is greater than the specified
     * expression.
     * 
     * @constant
     */
    GREATER_THAN: 20,

    /**
     * Greater than or equal to operator. Checks if an element is greater than
     * or equal to the specified expression.
     * 
     * @constant
     */
    GREATER_THAN_EQUAL: 21,

    /**
     * Not equal operator. Checks if an element does not equals the specified
     * expression.
     * 
     * @constant
     */
    NOT_EQUAL: 22,

    // Geoqueries.
    /**
     * Near sphere operator. Checks if an element is close to the point in the
     * specified expression.
     * 
     * @constant
     */
    NEAR_SPHERE: 1024,

    /**
     * Within box operator. Checks if an element is within the box shape as
     * defined by the expression.
     * 
     * @constant
     */
    WITHIN_BOX: 1025,

    /**
     * Within center sphere operator. Checks if an element is within a center
     * sphere as defined by the expression.
     * 
     * @constant
     */
    WITHIN_CENTER_SPHERE: 1026,

    /**
     * Within polygon operator. Checks if an element is within a polygon shape
     * as defined by the expression.
     * 
     * @constant
     */
    WITHIN_POLYGON: 1027,

    /**
     * Max distance operator. Checks if an element is within a certain distance
     * to the point in the specified expression. This operator requires the use
     * of the near operator as well.
     * 
     * @constant
     */
    MAX_DISTANCE: 1028,

    // Set membership
    /**
     * In operator. Checks if an element matches any values in the specified
     * expression.
     * 
     * @constant
     */
    IN: 2048,

    /**
     * Not in operator. Checks if an element does not match any value in the
     * specified expression.
     * 
     * @constant
     */
    NOT_IN: 2049,

    // Joining operators.
    /**
     * And operator. Supported implicitly.
     * 
     * @constant
     */
    AND: 4096,

    /**
     * Or operator. Not supported.
     * 
     * @constant
     */
    OR: 4097,

    // Array operators.
    /**
     * All operator. Checks if an element matches all values in the specified
     * expression
     * 
     * @constant
     */
    ALL: 8192,

    /**
     * Size operator. Checks if the size of an element matches the specified
     * expression.
     * 
     * @constant
     */
    SIZE: 8193,

    // Sort operators.
    /**
     * Ascending sort operator.
     * 
     * @constant
     */
    ASC: 16384,

    /**
     * Descending sort operator.
     * 
     * @constant
     */
    DESC: 16385,

    /**
     * Returns a query builder.
     * 
     * @return {Object} One of Kinvey.Query.* builders.
     */
    factory: function() {
      // Currently, only the Mongo builder is supported.
      return new Kinvey.Query.MongoBuilder();
    }
  });

}());