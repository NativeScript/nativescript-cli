(function() {

  // Define the Kinvey Query class.
  Kinvey.Query = Base.extend({
    // Key under condition.
    currentKey: null,

    /**
     * Creates a new query.
     * 
     * @example <code>
     * var query = new Kinvey.Query();
     * </code>
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
     * Sets an all condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must be an Array containing both "foo" and "bar".
     * var query = new Kinvey.Query();
     * query.on('field').all(['foo', 'bar']);
     * </code>
     * 
     * @param {Array} expected Array of expected values.
     * @throws {Error}
     *           <ul>
     *           <li>On invalid argument,</li>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    all: function(expected) {
      if(!(expected instanceof Array)) {
        throw new Error('Argument must be of type Array');
      }
      this._set(Kinvey.Query.ALL, expected);
      return this;
    },

    /**
     * Sets an AND condition.
     * 
     * @example <code>
     * // Attribute "field1" must have value "foo", and "field2" must have value "bar".
     * var query1 = new Kinvey.Query();
     * var query2 = new Kinvey.Query();
     * query1.on('field1').equal('foo');
     * query2.on('field2').equal('bar');
     * query1.and(query2);
     * </code>
     * 
     * @param {Kinvey.Query} query Query to AND.
     * @throws {Error} On invalid instance.
     * @return {Kinvey.Query} Current instance.
     */
    and: function(query) {
      this._set(Kinvey.Query.AND, query.builder, true);// do not throw.
      return this;
    },

    /**
     * Sets an equal condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must have value "foo".
     * var query = new Kinvey.Query();
     * query.on('field').equal('foo');
     * </code>
     * 
     * @param {*} expected Expected value.
     * @throws {Error}
     *           <ul>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    equal: function(expected) {
      this._set(Kinvey.Query.EQUAL, expected);
      return this;
    },

    /**
     * Sets an exist condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must exist.
     * var query = new Kinvey.Query();
     * query.on('field').exist();
     * </code>
     * 
     * @param {boolean} [expected] Boolean indicating whether field must be
     *          present. Defaults to true.
     * @throws {Error}
     *           <ul>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    exist: function(expected) {
      // Make sure the argument is of type boolean.
      expected = 'undefined' !== typeof expected ? !!expected : true;

      this._set(Kinvey.Query.EXIST, expected);
      return this;
    },

    /**
     * Sets a greater than condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must have a value greater than 25.
     * var query = new Kinvey.Query();
     * query.on('field').greaterThan(25);
     * </code>
     * 
     * @param {*} value Compared value.
     * @throws {Error}
     *           <ul>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    greaterThan: function(value) {
      this._set(Kinvey.Query.GREATER_THAN, value);
      return this;
    },

    /**
     * Sets a greater than equal condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must have a value greater than or equal to 25.
     * var query = new Kinvey.Query();
     * query.on('field').greaterThanEqual(25);
     * </code>
     * 
     * @param {*} value Compared value.
     * @throws {Error}
     *           <ul>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    greaterThanEqual: function(value) {
      this._set(Kinvey.Query.GREATER_THAN_EQUAL, value);
      return this;
    },

    /**
     * Sets an in condition on the current key. Method has underscore
     * postfix since "in" is a reserved word.
     * 
     * @example <code>
     * // Attribute "field" must be an Array containing "foo" and/or "bar".
     * var query = new Kinvey.Query();
     * query.on('field').in_(['foo', 'bar']);
     * </code>
     * 
     * @param {Array} expected Array of expected values.
     * @throws {Error}
     *           <ul>
     *           <li>On invalid argument,</li>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    in_: function(expected) {
      if(!(expected instanceof Array)) {
        throw new Error('Argument must be of type Array');
      }
      this._set(Kinvey.Query.IN, expected);
      return this;
    },

    /**
     * Sets a less than condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must have a value less than 25.
     * var query = new Kinvey.Query();
     * query.on('field').lessThan(25);
     * </code>
     * 
     * @param {*} value Compared value.
     * @throws {Error}
     *           <ul>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    lessThan: function(value) {
      this._set(Kinvey.Query.LESS_THAN, value);
      return this;
    },

    /**
     * Sets a less than equal condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must have a value less than or equal to 25.
     * var query = new Kinvey.Query();
     * query.on('field').lessThanEqual(25);
     * </code>
     * 
     * @param {*} value Compared value.
     * @throws {Error}
     *           <ul>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    lessThanEqual: function(value) {
      this._set(Kinvey.Query.LESS_THAN_EQUAL, value);
      return this;
    },

    /**
     * Sets a near sphere condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must be a point within a 10 mile radius of [-71, 42].
     * var query = new Kinvey.Query();
     * query.on('field').nearSphere([-71, 42], 10);
     * </code>
     * 
     * @param {Array} point Point [lng, lat].
     * @param {number} [maxDistance] Max distance from point in miles.
     * @throws {Error}
     *           <ul>
     *           <li>On invalid argument,</li>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    nearSphere: function(point, maxDistance) {
      if(!(point instanceof Array) || 2 !== point.length) {
        throw new Error('Point must be of type Array[lng, lat]');
      }
      this._set(Kinvey.Query.NEAR_SPHERE, {
        point: point,
        maxDistance: 'undefined' !== typeof maxDistance ? maxDistance : null
      });
      return this;
    },

    /**
     * Sets a not equal condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must have a value not equal to "foo".
     * var query = new Kinvey.Query();
     * query.on('field').notEqual('foo');
     * </code>
     * 
     * @param {*} value Unexpected value.
     * @throws {Error}
     *           <ul>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    notEqual: function(unexpected) {
      this._set(Kinvey.Query.NOT_EQUAL, unexpected);
      return this;
    },

    /**
     * Sets a not in condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must have a value not equal to "foo" or "bar".
     * var query = new Kinvey.Query();
     * query.on('field').notIn(['foo', 'bar']);
     * </code>
     * 
     * @param {Array} unexpected Array of unexpected values.
     * @throws {Error}
     *           <ul>
     *           <li>On invalid argument,</li>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    notIn: function(unexpected) {
      if(!(unexpected instanceof Array)) {
        throw new Error('Argument must be of type Array');
      }
      this._set(Kinvey.Query.NOT_IN, unexpected);
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
     * Sets an OR condition.
     * 
     * @example <code>
     * // Attribute "field1" must have value "foo", or "field2" must have value "bar".
     * var query1 = new Kinvey.Query();
     * var query2 = new Kinvey.Query();
     * query1.on('field1').equal('foo');
     * query2.on('field2').equal('bar');
     * query1.or(query2);
     * </code>
     * 
     * @param {Kinvey.Query} query Query to OR.
     * @throws {Error} On invalid instance.
     * @return {Kinvey.Query} Current instance.
     */
    or: function(query) {
      this._set(Kinvey.Query.OR, query.builder, true);// do not throw.
      return this;
    },

    /**
     * Sets a not in condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must have a value starting with foo.
     * var query = new Kinvey.Query();
     * query.on('field').regex(/^foo/);
     * </code>
     * 
     * @param {object} expected Regular expression.
     * @throws {Error} On invalid regular expression.
     * @return {Kinvey.Query} Current instance.
     */
    regex: function(expected) {
      this._set(Kinvey.Query.REGEX, expected);
      return this;
    },

    /**
     * Resets all filters.
     * 
     * @return {Kinvey.Query} Current instance.
     */
    reset: function() {
      this.builder.reset();
      return this;
    },

    /**
     * Sets the query limit.
     * 
     * @param {number} limit Limit.
     * @return {Kinvey.Query} Current instance.
     */
    setLimit: function(limit) {
      this.builder.setLimit(limit);
      return this;
    },

    /**
     * Sets the query skip.
     * 
     * @param {number} skip Skip.
     * @return {Kinvey.Query} Current instance.
     */
    setSkip: function(skip) {
      this.builder.setSkip(skip);
      return this;
    },

    /**
     * Sets a size condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must be an Array with 25 elements.
     * var query = new Kinvey.Query();
     * query.on('field').size(25);
     * </code>
     * 
     * @param {number} expected Expected value.
     * @throws {Error}
     *           <ul>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    size: function(expected) {
      this._set(Kinvey.Query.SIZE, expected);
      return this;
    },

    /**
     * Sets the query sort.
     * 
     * @param {number} [direction] Sort direction, or null to reset sort.
     *          Defaults to ascending.
     * @return {Kinvey.Query} Current instance.
     */
    sort: function(direction) {
      if(null !== direction) {
        direction = direction || Kinvey.Query.ASC;
      }
      this.builder.setSort(this.currentKey, direction);
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
     * Sets a within box condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must be a point within the box [-72, 41], [-70, 43].
     * var query = new Kinvey.Query();
     * query.on('field').withinBox([[-72, 41], [-70, 43]]);
     * </code>
     * 
     * @param {Array} points Array of two points [[lng, lat], [lng, lat]].
     * @throws {Error}
     *           <ul>
     *           <li>On invalid argument,</li>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    withinBox: function(points) {
      if(!(points instanceof Array) || 2 !== points.length) {
        throw new Error('Points must be of type Array[[lng, lat], [lng, lat]]');
      }
      this._set(Kinvey.Query.WITHIN_BOX, points);
      return this;
    },

    /**
     * Sets a within center sphere condition on the current key.
     * 
     * @example <code>
     * // Attribute "field" must be a point within a 10 mile radius of [-71, 42].
     * var query = new Kinvey.Query();
     * query.on('field').withinCenterSphere([-72, 41], 0.0025);
     * </code>
     * 
     * @param {Array} point Point [lng, lat].
     * @param {number} radius Radius in radians.
     * @throws {Error}
     *           <ul>
     *           <li>On invalid argument,</li>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    withinCenterSphere: function(point, radius) {
      if(!(point instanceof Array) || 2 !== point.length) {
        throw new Error('Point must be of type Array[lng, lat]');
      }
      this._set(Kinvey.Query.WITHIN_CENTER_SPHERE, {
        center: point,
        radius: radius
      });
      return this;
    },

    /**
     * Sets a within polygon condition on the current key.
     * 
     * @param {Array} points Array of points [[lng, lat], ...].
     * @throws {Error}
     *           <ul>
     *           <li>On invalid argument,</li>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     * @return {Kinvey.Query} Current instance.
     */
    withinPolygon: function(points) {
      if(!(points instanceof Array)) {
        throw new Error('Points must be of type Array[[lng, lat], ...]');
      }
      this._set(Kinvey.Query.WITHIN_POLYGON, points);
      return this;
    },

    /**
     * Helper function to forward condition to builder.
     * 
     * @private
     * @throws {Error}
     *           <ul>
     *           <li>When there is no key under condition,</li>
     *           <li>When the condition is not supported by the builder.</li>
     *           </ul>
     */
    _set: function(operator, value, bypass) {
      // Bypass flag can be used to avoid throwing an error.
      if(null === this.currentKey && !bypass) {
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
     * Greater than operator. Checks if an element is greater than the
     * specified expression.
     * 
     * @constant
     */
    GREATER_THAN: 20,

    /**
     * Greater than or equal to operator. Checks if an element is greater
     * than or equal to the specified expression.
     * 
     * @constant
     */
    GREATER_THAN_EQUAL: 21,

    /**
     * Not equal operator. Checks if an element does not equals the
     * specified expression.
     * 
     * @constant
     */
    NOT_EQUAL: 22,

    /**
     * Regular expression operator. Checks if an element matches the specified
     * expression.
     * 
     * @constant
     */
    REGEX: 23,

    // Geoqueries.
    /**
     * Near sphere operator. Checks if an element is close to the point in
     * the specified expression.
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
     * Within center sphere operator. Checks if an element is within a
     * center sphere as defined by the expression.
     * 
     * @constant
     */
    WITHIN_CENTER_SPHERE: 1026,

    /**
     * Within polygon operator. Checks if an element is within a polygon
     * shape as defined by the expression.
     * 
     * @constant
     */
    WITHIN_POLYGON: 1027,

    /**
     * Max distance operator. Checks if an element is within a certain
     * distance to the point in the specified expression. This operator
     * requires the use of the near operator as well.
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
     * All operator. Checks if an element matches all values in the
     * specified expression
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