// import CoreObject from './object';
// import isArray from 'lodash/lang/isArray';
// import isNumber from 'lodash/lang/isNumber';
// import isString from 'lodash/lang/isString';
// import isObject from 'lodash/lang/isObject';
// import utils from './utils';
// const privateQuerySymbol = Symbol();

// class Query extends CoreObject {
//   constructor(options = {}) {
//     super();

//     /**
//      * Fields to select.
//      *
//      * @type {Array}
//      */
//     this.fields = options.fields || [];

//     /**
//      * The MongoDB query.
//      *
//      * @type {Object}
//      */
//     this.filter = options.filter || {};

//     /**
//      * The sorting order.
//      *
//      * @type {Object}
//      */
//     this.sort = options.sort || {};

//     /**
//      * Number of documents to select.
//      *
//      * @type {?Number}
//      */
//     this.limit = options.limit || null;

//     /**
//      * Number of documents to skip from the start.
//      *
//      * @type {Number}
//      */
//     this.skip = options.skip || 0;

//     /**
//      * Maintain reference to the parent query in case the query is part of a
//      * join.
//      *
//      * @type {?PrivateQuery}
//      */
//     this.parent = null;
//   }

//   /**
//    * Adds a filter to the query.
//    *
//    * @param   {String}          field       Field.
//    * @param   {String}          condition   Condition.
//    * @param   {*}               value       Value.
//    * @returns {PrivateQuery}                The query.
//    */
//   addFilter(field, condition, values) {
//     if (!isObject(this.filter[field])) {
//       this.filter[field] = {};
//     }

//     this.filter[field][condition] = values;
//     return this;
//   }

//   /**
//    * Joins the current query with another query using an operator.
//    *
//    * @param   {String}                    operator    Operator.
//    * @param   {PrivateQuery[]|Object[]}   queries     Queries.
//    * @throws  {Error}                                `query` must be of type: `Kinvey.Query[]` or `Object[]`.
//    * @returns {PrivateQuery}                          The query.
//    */
//   join(operator, queries) {
//     let result = this;
//     let currentQuery = {};

//     // Cast, validate, and parse arguments. If `queries` are supplied, obtain
//     // the `filter` for joining. The eventual return function will be the
//     // current query.
//     queries = queries.map(function(query) {
//       if (!(query instanceof PrivateQuery)) {
//         if (isObject(query)) {
//           query = new PrivateQuery(query);
//         } else {
//           throw new Error('query argument must be of type: Kinvey.Query[] or Object[].');
//         }
//       }

//       return query.toJSON().filter;
//     });

//     // If there are no `queries` supplied, create a new (empty) `Query`.
//     // This query is the right-hand side of the join expression, and will be
//     // returned to allow for a fluent interface.
//     if (queries.length === 0) {
//       result = new PrivateQuery();
//       queries = [result.toJSON().filter];
//       result.parent = this; // Required for operator precedence and `toJSON`.
//     }

//     // Join operators operate on the top-level of `filter`. Since the `toJSON`
//     // magic requires `filter` to be passed by reference, we cannot simply re-
//     // assign `filter`. Instead, empty it without losing the reference.
//     for (let member in this.filter) {
//       if (this.filter.hasOwnProperty(member)) {
//         currentQuery[member] = this.filter[member];
//         delete this.filter[member];
//       }
//     }

//     // `currentQuery` is the left-hand side query. Join with `queries`.
//     this.filter[operator] = [currentQuery].concat(queries);

//     // Return the current query if there are `queries`, and the new (empty)
//     // `PrivateQuery` otherwise.
//     return result;
//   }

//   /**
//    * Post processes the raw response by applying sort, limit, and skip.
//    *
//    * @param   {Array}   response    The raw response.
//    * @throws  {Error}               `response` must be of type: `Array`.
//    * @returns {Array}               The processed response.
//    */
//   postProcess(response) {
//     // Validate arguments.
//     if (!isArray(response)) {
//       throw new Error('response argument must be of type: Array.');
//     }

//     // Sorting.
//     response = response.sort((a, b) => {
//       for (let field in this.sort) {
//         if (this.sort.hasOwnProperty(field)) {
//           // Find field in objects.
//           let aField = utils.nested(a, field);
//           let bField = utils.nested(b, field);

//           // Elements which do not contain the field should always be sorted
//           // lower.
//           if (utils.isDefined(aField) && !utils.isDefined(bField)) {
//             return -1;
//           }

//           if (utils.isDefined(bField) && !utils.isDefined(aField)) {
//             return 1;
//           }

//           // Sort on the current field. The modifier adjusts the sorting order
//           // (ascending (-1), or descending(1)). If the fields are equal,
//           // continue sorting based on the next field (if any).
//           if (aField !== bField) {
//             let modifier = this.sort[field]; // 1 or -1.
//             return (aField < bField ? -1 : 1) * modifier;
//           }
//         }
//       }

//       return 0;
//     });

//     // Limit and skip.
//     if (utils.isDefined(this.limit)) {
//       return response.slice(this.skip, this.skip + this.limit);
//     }

//     return response.slice(this.skip);
//   }

//   /**
//    * Returns JSON representation of the query.
//    *
//    * @returns {Object} JSON object-literal.
//    */
//   toJSON() {
//     // If the query is part of a join, return the top-level JSON representation
//     // instead
//     if(utils.isDefined(this.parent)) {
//       return this.parent.toJSON();
//     }

//     // Return set of parameters.
//     return {
//       fields: this.fields,
//       filter: this.filter,
//       sort: this.sort,
//       skip: this.skip,
//       limit: this.limit
//     };
//   }
// }

// class Query extends CoreObject {
//   constructor(options = {}) {
//     super();

//     // Create a private query
//     this[privateQuerySymbol] = new PrivateQuery(options);
//   }

//   /**
//    * Adds an equal to filter to the query. Requires `field` to equal `value`.
//    * Any existing filters on `field` will be discarded.
//    * http://docs.mongodb.org/manual/reference/operators/#comparison
//    *
//    * @param   {String}        field     Field.
//    * @param   {*}             value     Value.
//    * @returns {Query}                   The query.
//    */
//   equalTo(field, value) {
//     let privateQuery = this[privateQuerySymbol];
//     privateQuery.filter[field] = value;
//     return this;
//   }

//   /**
//    * Adds a contains filter to the query. Requires `field` to contain at least
//    * one of the members of `list`.
//    * http://docs.mongodb.org/manual/reference/operator/in/
//    *
//    * @param   {String}        field     Field.
//    * @param   {Array}         values    List of values.
//    * @throws  {Error}                   `values` must be of type: `Array`.
//    * @returns {Query}                   The query.
//    */
//   contains(field, values) {
//     // Validate arguments
//     if (!isArray(values)) {
//       throw new Error('You must supply an array.');
//     }

//     let privateQuery = this[privateQuerySymbol];
//     privateQuery.addFilter(field, '$in', values);
//     return this;
//   }

//   /**
//    * Adds a contains all filter to the query. Requires `field` to contain all
//    * members of `list`.
//    * http://docs.mongodb.org/manual/reference/operator/all/
//    *
//    * @param   {String}  field     Field.
//    * @param   {Array}   values    List of values.
//    * @throws  {Error}             `values` must be of type: `Array`.
//    * @returns {Query}             The query.
//    */
//   containsAll(field, values) {
//     // Validate arguments
//     if (!isArray(values)) {
//       throw new Error('You must supply an array.');
//     }

//     let privateQuery = this[privateQuerySymbol];
//     privateQuery.addFilter(field, '$all', values);
//     return this;
//   }

//   /**
//    * Adds a greater than filter to the query. Requires `field` to be greater
//    * than `value`.
//    * http://docs.mongodb.org/manual/reference/operator/gt/
//    *
//    * @param   {String}          field     Field.
//    * @param   {Number|String}   value     Value.
//    * @throws  {Error}                     `value` must be of type: `number` or `string`.
//    * @returns {Query}                     The query.
//    */
//   greaterThan(field, value) {
//     // Validate arguments
//     if (!isNumber(value) || !isString(value)) {
//       throw new Error('You must supply a number or string.');
//     }

//     let privateQuery = this[privateQuerySymbol];
//     privateQuery.addFilter(field, '$gt', value);
//     return this;
//   }

//   greaterThanOrEqualTo(field, value) {

//   }

//   lessThan(field, value) {

//   }

//   lessThanOrEqualTo(field, value) {

//   }

//   notEqualTo(field, value) {

//   }

//   notContainedIn(field, values) {

//   }

//   and() {

//   }

//   nor() {

//   }

//   or() {

//   }

//   exists(field, flag) {

//   }

//   mod(field, divisor, remainder) {

//   }

//   matches(field, regExp, options = {}) {

//   }

//   near(field, coord, maxDistance) {

//   }

//   withinBox(field, bottomLeftCoord, upperRightCoord) {

//   }

//   withinPolygon(field, coords) {

//   }

//   size(field, size) {

//   }

//   fields(fields) {

//   }

//   limit(limit) {

//   }

//   skip(skip) {

//   }

//   ascending(field) {

//   }

//   descending(field) {

//   }

//   sort(sort) {

//   }

//   /**
//    * Returns JSON representation of the query.
//    *
//    * @returns {Object} JSON object-literal.
//    */
//   toJSON() {
//     let privateQuery = this[privateQuerySymbol];
//     return privateQuery.toJSON();
//   }
// }

// export default Query;

import CoreObject from './object';

class Query extends CoreObject {

}

export default Query;
