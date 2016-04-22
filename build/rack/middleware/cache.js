'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheMiddleware = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _middleware = require('../middleware');

var _db = require('../persistence/db');

var _enums = require('../../enums');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @private
 */

var CacheMiddleware = exports.CacheMiddleware = function (_KinveyMiddleware) {
  _inherits(CacheMiddleware, _KinveyMiddleware);

  function CacheMiddleware() {
    var adapters = arguments.length <= 0 || arguments[0] === undefined ? [_db.DBAdapter.IndexedDB, _db.DBAdapter.WebSQL, _db.DBAdapter.LocalStorage, _db.DBAdapter.Memory] : arguments[0];

    _classCallCheck(this, CacheMiddleware);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CacheMiddleware).call(this, 'Kinvey Cache Middleware'));

    _this.adapters = adapters;
    return _this;
  }

  _createClass(CacheMiddleware, [{
    key: 'handle',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(request) {
        var method, query, data, db, result;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _get(Object.getPrototypeOf(CacheMiddleware.prototype), 'handle', this).call(this, request);

              case 2:
                request = _context.sent;
                method = request.method;
                query = request.query;
                data = request.data;
                db = new _db.DB(request.appKey, this.adapters);
                result = void 0;

                if (!(method === _enums.HttpMethod.GET)) {
                  _context.next = 32;
                  break;
                }

                if (!request.entityId) {
                  _context.next = 27;
                  break;
                }

                if (!(request.entityId === '_count')) {
                  _context.next = 16;
                  break;
                }

                _context.next = 13;
                return db.count(request.collectionName, query);

              case 13:
                result = _context.sent;
                _context.next = 25;
                break;

              case 16:
                if (!(request.entityId === '_group')) {
                  _context.next = 22;
                  break;
                }

                _context.next = 19;
                return db.group(request.collectionName, data);

              case 19:
                result = _context.sent;
                _context.next = 25;
                break;

              case 22:
                _context.next = 24;
                return db.findById(request.collectionName, request.entityId);

              case 24:
                result = _context.sent;

              case 25:
                _context.next = 30;
                break;

              case 27:
                _context.next = 29;
                return db.find(request.collectionName, query);

              case 29:
                result = _context.sent;

              case 30:
                _context.next = 48;
                break;

              case 32:
                if (!(method === _enums.HttpMethod.POST || method === _enums.HttpMethod.PUT)) {
                  _context.next = 38;
                  break;
                }

                _context.next = 35;
                return db.save(request.collectionName, data);

              case 35:
                result = _context.sent;
                _context.next = 48;
                break;

              case 38:
                if (!(method === _enums.HttpMethod.DELETE)) {
                  _context.next = 48;
                  break;
                }

                if (!request.entityId) {
                  _context.next = 45;
                  break;
                }

                _context.next = 42;
                return db.removeById(request.collectionName, request.entityId);

              case 42:
                result = _context.sent;
                _context.next = 48;
                break;

              case 45:
                _context.next = 47;
                return db.remove(request.collectionName, query);

              case 47:
                result = _context.sent;

              case 48:

                request.response = {
                  statusCode: method === _enums.HttpMethod.POST ? _enums.StatusCode.Created : _enums.StatusCode.Ok,
                  headers: {},
                  data: result
                };

                return _context.abrupt('return', request);

              case 50:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function handle(_x2) {
        return ref.apply(this, arguments);
      }

      return handle;
    }()
  }]);

  return CacheMiddleware;
}(_middleware.KinveyMiddleware);