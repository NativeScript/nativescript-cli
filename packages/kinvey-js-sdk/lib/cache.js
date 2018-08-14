'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.use = use;

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var adapter = {
  find: function find() {
    throw new Error('You must override the default cache adapter.');
  },
  reduce: function reduce() {
    throw new Error('You must override the default cache adapter.');
  },
  count: function count() {
    throw new Error('You must override the default cache adapter.');
  },
  findById: function findById() {
    throw new Error('You must override the default cache adapter.');
  },
  save: function save() {
    throw new Error('You must override the default cache adapter.');
  },
  remove: function remove() {
    throw new Error('You must override the default cache adapter.');
  },
  removeById: function removeById() {
    throw new Error('You must override the default cache adapter.');
  },
  clear: function clear() {
    throw new Error('You must override the default cache adapter.');
  }
};

/**
 * @private
 */
function use(customAdapter) {
  adapter = customAdapter;
}

function generateId() {
  var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 24;

  var chars = 'abcdef0123456789';
  var id = '';

  for (var i = 0, j = chars.length; i < length; i += 1) {
    var pos = Math.floor(Math.random() * j);
    id += chars.substring(pos, pos + 1);
  }

  return id;
}

var Cache = function () {
  function Cache(dbName, collectionName) {
    _classCallCheck(this, Cache);

    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  _createClass(Cache, [{
    key: 'find',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(query) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', adapter.find(this.dbName, this.collectionName, query));

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function find(_x2) {
        return _ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'reduce',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(aggregation) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', adapter.reduce(this.dbName, this.collectionName, aggregation));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function reduce(_x3) {
        return _ref2.apply(this, arguments);
      }

      return reduce;
    }()
  }, {
    key: 'count',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(query) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt('return', adapter.count(this.dbName, this.collectionName, query));

              case 1:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function count(_x4) {
        return _ref3.apply(this, arguments);
      }

      return count;
    }()
  }, {
    key: 'findById',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(id) {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt('return', adapter.findById(this.dbName, this.collectionName, id));

              case 1:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function findById(_x5) {
        return _ref4.apply(this, arguments);
      }

      return findById;
    }()
  }, {
    key: 'save',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(docsToSaveOrUpdate) {
        var docs, singular;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                docs = docsToSaveOrUpdate;
                singular = false;

                if (docs) {
                  _context5.next = 4;
                  break;
                }

                return _context5.abrupt('return', null);

              case 4:

                if (!(0, _isArray2.default)(docs)) {
                  singular = true;
                  docs = [docs];
                }

                if (!(docs.length > 0)) {
                  _context5.next = 9;
                  break;
                }

                docs = docs.map(function (doc) {
                  if (!doc._id) {
                    return Object.assign({
                      _id: generateId(),
                      _kmd: Object.assign({}, doc._kmd, { local: true })
                    }, doc);
                  }

                  return doc;
                });

                _context5.next = 9;
                return adapter.save(this.dbName, this.collectionName, docs);

              case 9:
                return _context5.abrupt('return', singular ? docs[0] : docs);

              case 10:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function save(_x6) {
        return _ref5.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: 'remove',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(query) {
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.abrupt('return', adapter.remove(this.dbName, this.collectionName, query));

              case 1:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function remove(_x7) {
        return _ref6.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: 'removeById',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(id) {
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                return _context7.abrupt('return', adapter.removeById(this.dbName, this.collectionName, id));

              case 1:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function removeById(_x8) {
        return _ref7.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: 'clear',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                return _context8.abrupt('return', adapter.clear(this.dbName, this.collectionName));

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function clear() {
        return _ref8.apply(this, arguments);
      }

      return clear;
    }()
  }]);

  return Cache;
}();

exports.default = Cache;