(function(Kinvey) {

  /**
   * Creates new JsonQueryBuilder
   * 
   * @constructor
   */
  Kinvey.Query.JsonQueryBuilder = function() {
    // Operator translation map for MongoDB
    this.MAP = {
      ALL: '$all',
      CONTAINS: '$in',
      EXISTS: '$exists',
      GREATER_THAN: '$gt',
      GREATER_THAN_OR_EQUAL: '$gte',
      LESS_THAN: '$lt',
      LESS_THAN_OR_EQUAL: '$lte',
      NEAR: '$near',
      NOT_EQUAL: '$ne',
      NOT_IN: '$nin',
      SIZE: '$size',
      WITHIN: '$within'
    };

    // Properties
    /**
     * Key under comparison
     * 
     * @private
     * @type string
     */
    this.currentKey = null;

    /**
     * Query map
     * 
     * @private
     * @type Object
     */
    this.query = {};
  };

  // Methods
  extend(Kinvey.Query.JsonQueryBuilder.prototype, {
    /** @lends Kinvey.Query.JsonQueryBuilder# */

    /**
     * Uses the all operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    all: function(value) {
      this._addOperand(this.MAP.ALL, value);
      return this;
    },

    /**
     * Clears query
     * 
     */
    clear: function() {
      this.query = {};
    },

    /**
     * Uses the in operator. Method is named contains since in is a reserved
     * word.
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    contains: function(value) {
      this._addOperand(this.MAP.CONTAINS, value);
      return this;
    },

    /**
     * Uses the exists operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    exists: function(value) {
      this._addOperand(this.MAP.EXISTS, value);
      return this;
    },

    /**
     * Returns query map
     * 
     * @return {Object} query map
     */
    get: function() {
      return this.query;
    },

    /**
     * Uses the greater than operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    greaterThan: function(value) {
      this._addOperand(this.MAP.GREATER_THAN, value);
      return this;
    },

    /**
     * Uses the greater than or equals operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    greaterThanEquals: function(value) {
      this._addOperand(this.MAP.GREATER_THAN_OR_EQUAL, value);
      return this;
    },

    /**
     * Uses the equals operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    is: function(value) {
      this._addOperand(null, value);
      return this;
    },

    /**
     * Uses the less than operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    lessThan: function(value) {
      this._addOperand(this.MAP.LESS_THAN, value);
      return this;
    },

    /**
     * Uses the less than or equals operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    lessThanEquals: function(value) {
      this._addOperand(this.MAP.LESS_THAN_OR_EQUAL, value);
      return this;
    },

    /**
     * Uses the near operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    near: function(value) {
      this._addOperand(this.MAP.NEAR, value);
      return this;
    },

    /**
     * Uses the not equals operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    notEquals: function(value) {
      this._addOperand(this.MAP.NOT_EQUAL, value);
      return this;
    },

    /**
     * Uses the not in operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    notIn: function(value) {
      this._addOperand(this.MAP.NOT_IN, value);
      return this;
    },

    /**
     * Adds key to query and sets this key as the current key
     * 
     * @param {*} key property name
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    put: function(key) {
      this.currentKey = key;
      return this;
    },

    /**
     * Uses the size operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    size: function(value) {
      this._addOperand(this.MAP.SIZE, value);
      return this;
    },

    /**
     * Uses the within operator
     * 
     * @param {*} value expression
     * @return {Kinvey.Query.JsonQueryBuilder} current builder
     */
    within: function(value) {
      this._addOperand(this.MAP.WITHIN, value);
      return this;
    },

    /**
     * Adds clause to query
     * 
     * @private
     * @param {string} operator comparison operator
     * @param {*} value expression
     */
    _addOperand: function(operator, value) {
      // If no operator is passed, currentKey needs to equal value
      if(null == operator) {
        this.query[this.currentKey] = value;
        return;
      }

      // Instantiate comparison object for key
      if(!(this.query[this.currentKey] instanceof Object)) {
        this.query[this.currentKey] = {};
      }
      this.query[this.currentKey][operator] = value;// save comparison
    }
  });

}(Kinvey));