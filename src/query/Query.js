(function(Kinvey) {

  /**
   * Kinvey Query namespace definition. This namespace allows for generic query
   * construction and provides generic operator constants.
   * 
   * @namespace
   */
  Kinvey.Query = {
    // Operator constants
    /**
     * All operator. Checks if an element matches all values in the specified
     * expression
     * 
     * @constant
     */
    ALL: 'all',

    /**
     * Contains operator. Checks if an element matches any values in the
     * specified expression. Used instead of in, since in is a reserved word.
     * 
     * @constant
     */
    CONTAINS: 'contains',

    /**
     * Element match operator. Checks if an element in an array matches the
     * specified expression
     * 
     * @constant
     */
    ELEMENT_MATCH: 'elem',

    /**
     * Equal operator. Checks if an element equals the specified expression
     * 
     * @constant
     */
    EQUAL: '==',

    /**
     * Exists operator. Checks the existence of an element.
     * 
     * @constant
     */
    EXISTS: 'exists',

    /**
     * Greater than operator. Checks if an element is greater than the specified
     * expression.
     * 
     * @constant
     */
    GREATER_THAN: '>',

    /**
     * Greater than or equal to operator. Checks if an element is greater than
     * or equal to the specified expression.
     * 
     * @constant
     */
    GREATER_THAN_OR_EQUAL: '>=',

    /**
     * Is operator. Synonym for the equal operator.
     * 
     * @constant
     */
    IS: 'is',

    /**
     * Less than operator. Checks if an element is less than the specified
     * expression.
     * 
     * @constant
     */
    LESS_THAN: '<',

    /**
     * Less than or equal to operator. Checks if an element is less than or
     * equal to the specified expression.
     * 
     * @constant
     */
    LESS_THAN_OR_EQUAL: '<=',

    /**
     * Near operator. Checks if an element is near the specified expression.
     * 
     * @constant
     */
    NEAR: 'near',

    /**
     * Not equal operator. Checks if an element does not equals the specified
     * expression.
     * 
     * @constant
     */
    NOT_EQUAL: '!=',

    /**
     * Not in operator. Checks if an element does not match any value in the
     * specified expression.
     * 
     * @constant
     */
    NOT_IN: 'nin',

    /**
     * Size operator. Checks if the size of an element matches the specified
     * expression.
     * 
     * @constant
     */
    SIZE: 'size',

    /**
     * Within operator. Checks if an element is within the specified expression.
     * 
     * @constant
     */
    WITHIN: 'within'
  };

}(Kinvey));