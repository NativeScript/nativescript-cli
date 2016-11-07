'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('./errors');

var _utils = require('./utils');

var _sift = require('sift');

var _sift2 = _interopRequireDefault(_sift);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _isRegExp = require('lodash/isRegExp');

var _isRegExp2 = _interopRequireDefault(_isRegExp);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _findKey = require('lodash/findKey');

var _findKey2 = _interopRequireDefault(_findKey);

var _has = require('lodash/has');

var _has2 = _interopRequireDefault(_has);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var unsupportedFilters = ['$nearSphere'];

var Query = function () {
  function Query(options) {
    _classCallCheck(this, Query);

    options = (0, _assign2.default)({
      fields: [],
      filter: {},
      sort: {},
      limit: null,
      skip: 0
    }, options);

    this.fields = options.fields;

    this.filter = options.filter;

    this.sort = options.sort;

    this.limit = options.limit;

    this.skip = options.skip;

    this._parent = null;
  }

  _createClass(Query, [{
    key: 'isSupportedOffline',
    value: function isSupportedOffline() {
      var _this = this;

      var supported = true;

      (0, _forEach2.default)(unsupportedFilters, function (filter) {
        supported = !(0, _findKey2.default)(_this.filter, filter);
        return supported;
      });

      return supported;
    }
  }, {
    key: 'equalTo',
    value: function equalTo(field, value) {
      return this.addFilter(field, value);
    }
  }, {
    key: 'contains',
    value: function contains(field, values) {
      if (!(0, _isArray2.default)(values)) {
        values = [values];
      }

      return this.addFilter(field, '$in', values);
    }
  }, {
    key: 'containsAll',
    value: function containsAll(field, values) {
      if (!(0, _isArray2.default)(values)) {
        values = [values];
      }

      return this.addFilter(field, '$all', values);
    }
  }, {
    key: 'greaterThan',
    value: function greaterThan(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new _errors.QueryError('You must supply a number or string.');
      }

      return this.addFilter(field, '$gt', value);
    }
  }, {
    key: 'greaterThanOrEqualTo',
    value: function greaterThanOrEqualTo(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new _errors.QueryError('You must supply a number or string.');
      }

      return this.addFilter(field, '$gte', value);
    }
  }, {
    key: 'lessThan',
    value: function lessThan(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new _errors.QueryError('You must supply a number or string.');
      }

      return this.addFilter(field, '$lt', value);
    }
  }, {
    key: 'lessThanOrEqualTo',
    value: function lessThanOrEqualTo(field, value) {
      if (!(0, _isNumber2.default)(value) && !(0, _isString2.default)(value)) {
        throw new _errors.QueryError('You must supply a number or string.');
      }

      return this.addFilter(field, '$lte', value);
    }
  }, {
    key: 'notEqualTo',
    value: function notEqualTo(field, value) {
      return this.addFilter(field, '$ne', value);
    }
  }, {
    key: 'notContainedIn',
    value: function notContainedIn(field, values) {
      if (!(0, _isArray2.default)(values)) {
        values = [values];
      }

      return this.addFilter(field, '$nin', values);
    }
  }, {
    key: 'and',
    value: function and() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return this.join('$and', args);
    }
  }, {
    key: 'nor',
    value: function nor() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if ((0, _utils.isDefined)(this._parent) && (0, _has2.default)(this._parent, 'filter.$and')) {
        var _parent;

        return (_parent = this._parent).nor.apply(_parent, args);
      }

      return this.join('$nor', args);
    }
  }, {
    key: 'or',
    value: function or() {
      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      if ((0, _utils.isDefined)(this._parent)) {
        var _parent2;

        return (_parent2 = this._parent).or.apply(_parent2, args);
      }

      return this.join('$or', args);
    }
  }, {
    key: 'exists',
    value: function exists(field, flag) {
      flag = typeof flag === 'undefined' ? true : flag || false;
      return this.addFilter(field, '$exists', flag);
    }
  }, {
    key: 'mod',
    value: function mod(field, divisor) {
      var remainder = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      if ((0, _isString2.default)(divisor)) {
        divisor = parseFloat(divisor);
      }

      if ((0, _isString2.default)(remainder)) {
        remainder = parseFloat(remainder);
      }

      if (!(0, _isNumber2.default)(divisor)) {
        throw new _errors.QueryError('divisor must be a number');
      }

      if (!(0, _isNumber2.default)(remainder)) {
        throw new _errors.QueryError('remainder must be a number');
      }

      return this.addFilter(field, '$mod', [divisor, remainder]);
    }
  }, {
    key: 'matches',
    value: function matches(field, regExp) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (!(0, _isRegExp2.default)(regExp)) {
        regExp = new RegExp(regExp);
      }

      if ((regExp.ignoreCase || options.ignoreCase) && options.ignoreCase !== false) {
        throw new _errors.QueryError('ignoreCase glag is not supported.');
      }

      if (regExp.source.indexOf('^') !== 0) {
        throw new _errors.QueryError('regExp must have `^` at the beginning of the expression ' + 'to make it an anchored expression.');
      }

      var flags = [];

      if ((regExp.multiline || options.multiline) && options.multiline !== false) {
        flags.push('m');
      }

      if (options.extended) {
        flags.push('x');
      }

      if (options.dotMatchesAll) {
        flags.push('s');
      }

      var result = this.addFilter(field, '$regex', regExp.source);

      if (flags.length) {
        this.addFilter(field, '$options', flags.join(''));
      }

      return result;
    }
  }, {
    key: 'near',
    value: function near(field, coord, maxDistance) {
      if (!(0, _isArray2.default)(coord) || !(0, _isNumber2.default)(coord[0]) || !(0, _isNumber2.default)(coord[1])) {
        throw new _errors.QueryError('coord must be a [number, number]');
      }

      var result = this.addFilter(field, '$nearSphere', [coord[0], coord[1]]);

      if ((0, _isNumber2.default)(maxDistance)) {
        this.addFilter(field, '$maxDistance', maxDistance);
      }

      return result;
    }
  }, {
    key: 'withinBox',
    value: function withinBox(field, bottomLeftCoord, upperRightCoord) {
      if (!(0, _isArray2.default)(bottomLeftCoord) || !(0, _isNumber2.default)(bottomLeftCoord[0]) || !(0, _isNumber2.default)(bottomLeftCoord[1])) {
        throw new _errors.QueryError('bottomLeftCoord must be a [number, number]');
      }

      if (!(0, _isArray2.default)(upperRightCoord) || !(0, _isNumber2.default)(upperRightCoord[0]) || !(0, _isNumber2.default)(upperRightCoord[1])) {
        throw new _errors.QueryError('upperRightCoord must be a [number, number]');
      }

      bottomLeftCoord[0] = parseFloat(bottomLeftCoord[0]);
      bottomLeftCoord[1] = parseFloat(bottomLeftCoord[1]);
      upperRightCoord[0] = parseFloat(upperRightCoord[0]);
      upperRightCoord[1] = parseFloat(upperRightCoord[1]);

      var coords = [[bottomLeftCoord[0], bottomLeftCoord[1]], [upperRightCoord[0], upperRightCoord[1]]];
      return this.addFilter(field, '$within', { $box: coords });
    }
  }, {
    key: 'withinPolygon',
    value: function withinPolygon(field, coords) {
      if (!(0, _isArray2.default)(coords) || coords.length > 3) {
        throw new _errors.QueryError('coords must be [[number, number]]');
      }

      coords = coords.map(function (coord) {
        if (!coord[0] || !coord[1]) {
          throw new _errors.QueryError('coords argument must be [number, number]');
        }

        return [parseFloat(coord[0]), parseFloat(coord[1])];
      });

      return this.addFilter(field, '$within', { $polygon: coords });
    }
  }, {
    key: 'size',
    value: function size(field, _size) {
      if ((0, _isString2.default)(_size)) {
        _size = parseFloat(_size);
      }

      if (!(0, _isNumber2.default)(_size)) {
        throw new _errors.QueryError('size must be a number');
      }

      return this.addFilter(field, '$size', _size);
    }
  }, {
    key: 'ascending',
    value: function ascending(field) {
      if ((0, _utils.isDefined)(this._parent)) {
        this._parent.ascending(field);
      } else {
        this.sort[field] = 1;
      }

      return this;
    }
  }, {
    key: 'descending',
    value: function descending(field) {
      if ((0, _utils.isDefined)(this._parent)) {
        this._parent.descending(field);
      } else {
        this.sort[field] = -1;
      }

      return this;
    }
  }, {
    key: 'addFilter',
    value: function addFilter(field, condition, values) {
      if (!(0, _isObject2.default)(this.filter[field])) {
        this.filter[field] = {};
      }

      if ((0, _utils.isDefined)(condition) && (0, _utils.isDefined)(values)) {
        this.filter[field][condition] = values;
      } else {
        this.filter[field] = condition;
      }

      return this;
    }
  }, {
    key: 'join',
    value: function join(operator, queries) {
      var _this2 = this;

      var that = this;
      var currentQuery = {};

      queries = queries.map(function (query) {
        if (!(query instanceof Query)) {
          if ((0, _isObject2.default)(query)) {
            query = new Query(query);
          } else {
            throw new _errors.QueryError('query argument must be of type: Kinvey.Query[] or Object[].');
          }
        }

        return query.toJSON().filter;
      });

      if (queries.length === 0) {
        that = new Query();
        queries = [that.toJSON().filter];
        that.parent = this;
      }

      var members = Object.keys(this.filter);
      (0, _forEach2.default)(members, function (member) {
        currentQuery[member] = _this2.filter[member];
        delete _this2.filter[member];
      });

      this.filter[operator] = [currentQuery].concat(queries);

      return that;
    }
  }, {
    key: 'process',
    value: function process(data) {
      if (this.isSupportedOffline() === false) {
        (function () {
          var message = 'This query is not able to run locally. The following filters are not supported' + ' locally:';

          (0, _forEach2.default)(unsupportedFilters, function (filter) {
            message = message + ' ' + filter;
          });

          throw new _errors.QueryError(message);
        })();
      }

      if (!(0, _isArray2.default)(data)) {
        throw new _errors.QueryError('data argument must be of type: Array.');
      }

      var json = this.toJSON();
      data = (0, _sift2.default)(json.filter, data);

      if ((0, _isArray2.default)(json.fields) && json.fields.length > 0) {
        data = data.map(function (item) {
          var keys = Object.keys(item);
          (0, _forEach2.default)(keys, function (key) {
            if (json.fields.indexOf(key) === -1) {
              delete item[key];
            }
          });

          return item;
        });

        data = data.sort(function (a, b) {
          var fields = Object.keys(json.sort);
          (0, _forEach2.default)(fields, function (field) {
            var aField = (0, _utils.nested)(a, field);
            var bField = (0, _utils.nested)(b, field);

            if ((0, _utils.isDefined)(aField) && !(0, _utils.isDefined)(bField)) {
              return -1;
            }

            if ((0, _utils.isDefined)(bField) && !(0, _utils.isDefined)(aField)) {
              return 1;
            }

            if (aField !== bField) {
              var modifier = json.sort[field];
              return (aField < bField ? -1 : 1) * modifier;
            }

            return 0;
          });

          return 0;
        });

        if ((0, _isNumber2.default)(json.skip)) {
          if ((0, _isNumber2.default)(json.limit)) {
            return data.slice(json.skip, json.skip + json.limit);
          }

          return data.slice(json.skip);
        }
      }

      return data;
    }
  }, {
    key: 'toPlainObject',
    value: function toPlainObject() {
      if ((0, _utils.isDefined)(this._parent)) {
        return this._parent.toPlainObject();
      }

      var json = {
        fields: this.fields,
        filter: this.filter,
        sort: this.sort,
        skip: this.skip,
        limit: this.limit
      };

      return json;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this.toPlainObject();
    }
  }, {
    key: 'toQueryString',
    value: function toQueryString() {
      var queryString = {};

      if (!(0, _isEmpty2.default)(this.filter)) {
        queryString.query = this.filter;
      }

      if (!(0, _isEmpty2.default)(this.fields)) {
        queryString.fields = this.fields.join(',');
      }

      if ((0, _isNumber2.default)(this.limit)) {
        queryString.limit = this.limit;
      }

      if ((0, _isNumber2.default)(this.skip) && this.skip > 0) {
        queryString.skip = this.skip;
      }

      if (!(0, _isEmpty2.default)(this.sort)) {
        queryString.sort = this.sort;
      }

      var keys = Object.keys(queryString);
      (0, _forEach2.default)(keys, function (key) {
        queryString[key] = (0, _isString2.default)(queryString[key]) ? queryString[key] : JSON.stringify(queryString[key]);
      });

      return queryString;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return JSON.stringify(this.toQueryString());
    }
  }, {
    key: 'fields',
    get: function get() {
      return this._fields;
    },
    set: function set(fields) {
      fields = fields || [];

      if (!(0, _isArray2.default)(fields)) {
        throw new _errors.QueryError('fields must be an Array');
      }

      if ((0, _utils.isDefined)(this._parent)) {
        this._parent.fields = fields;
      } else {
        this._fields = fields;
      }
    }
  }, {
    key: 'filter',
    get: function get() {
      return this._filter;
    },
    set: function set(filter) {
      this._filter = filter;
    }
  }, {
    key: 'sort',
    get: function get() {
      return this._sort;
    },
    set: function set(sort) {
      if (sort && !(0, _isObject2.default)(sort)) {
        throw new _errors.QueryError('sort must an Object');
      }

      if ((0, _utils.isDefined)(this._parent)) {
        this._parent.sort(sort);
      } else {
        this._sort = sort || {};
      }
    }
  }, {
    key: 'limit',
    get: function get() {
      return this._limit;
    },
    set: function set(limit) {
      if ((0, _isString2.default)(limit)) {
        limit = parseFloat(limit);
      }

      if ((0, _utils.isDefined)(limit) && !(0, _isNumber2.default)(limit)) {
        throw new _errors.QueryError('limit must be a number');
      }

      if (this._parent) {
        this._parent.limit = limit;
      } else {
        this._limit = limit;
      }
    }
  }, {
    key: 'skip',
    get: function get() {
      return this._skip;
    },
    set: function set() {
      var skip = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      if ((0, _isString2.default)(skip)) {
        skip = parseFloat(skip);
      }

      if (!(0, _isNumber2.default)(skip)) {
        throw new _errors.QueryError('skip must be a number');
      }

      if ((0, _utils.isDefined)(this._parent)) {
        this._parent.skip(skip);
      } else {
        this._skip = skip;
      }
    }
  }]);

  return Query;
}();

exports.default = Query;