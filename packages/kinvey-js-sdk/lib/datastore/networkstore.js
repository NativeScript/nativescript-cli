'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.createRequest = createRequest;

var _http = require('../http');

var _datastore = require('./datastore');

var _datastore2 = _interopRequireDefault(_datastore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NAMESPACE = 'appdata';

function createRequest(method, url, body) {
  return new _http.KinveyRequest({
    method: method,
    auth: _http.Auth.Session,
    url: url,
    body: body
  });
}

var NetworkStore = function (_DataStore) {
  _inherits(NetworkStore, _DataStore);

  function NetworkStore() {
    _classCallCheck(this, NetworkStore);

    return _possibleConstructorReturn(this, (NetworkStore.__proto__ || Object.getPrototypeOf(NetworkStore)).apply(this, arguments));
  }

  _createClass(NetworkStore, [{
    key: 'find',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(query) {
        var url, request, response;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                url = (0, _http.formatKinveyBaasUrl)(this.pathname, query ? query.toQueryObject() : undefined);
                request = createRequest(_http.RequestMethod.GET, url);
                _context.next = 4;
                return (0, _http.execute)(request);

              case 4:
                response = _context.sent;
                return _context.abrupt('return', response.data);

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function find(_x) {
        return _ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'count',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(query) {
        var url, request, response;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                url = (0, _http.formatKinveyBaasUrl)(this.pathname + '/_count', query ? query.toQueryObject() : undefined);
                request = createRequest(_http.RequestMethod.GET, url);
                _context2.next = 4;
                return (0, _http.execute)(request);

              case 4:
                response = _context2.sent;
                return _context2.abrupt('return', response.data);

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function count(_x2) {
        return _ref2.apply(this, arguments);
      }

      return count;
    }()
  }, {
    key: 'findById',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id) {
        var url, request, response;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                url = (0, _http.formatKinveyBaasUrl)(this.pathname + '/' + id);
                request = createRequest(_http.RequestMethod.GET, url);
                _context3.next = 4;
                return (0, _http.execute)(request);

              case 4:
                response = _context3.sent;
                return _context3.abrupt('return', response.data);

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function findById(_x3) {
        return _ref3.apply(this, arguments);
      }

      return findById;
    }()
  }, {
    key: 'create',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(doc) {
        var url, request, response;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                url = (0, _http.formatKinveyBaasUrl)(this.pathname);
                request = createRequest(_http.RequestMethod.POST, url, doc);
                _context4.next = 4;
                return (0, _http.execute)(request);

              case 4:
                response = _context4.sent;
                return _context4.abrupt('return', response.data);

              case 6:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function create(_x4) {
        return _ref4.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(doc) {
        var url, request, response;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                url = (0, _http.formatKinveyBaasUrl)(this.pathname);
                request = createRequest(_http.RequestMethod.PUT, url, doc);
                _context5.next = 4;
                return (0, _http.execute)(request);

              case 4:
                response = _context5.sent;
                return _context5.abrupt('return', response.data);

              case 6:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function update(_x5) {
        return _ref5.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: 'remove',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(query) {
        var url, request, response;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                url = (0, _http.formatKinveyBaasUrl)(this.pathname, query ? query.toQueryObject() : undefined);
                request = createRequest(_http.RequestMethod.DELETE, url);
                _context6.next = 4;
                return (0, _http.execute)(request);

              case 4:
                response = _context6.sent;
                return _context6.abrupt('return', response.data);

              case 6:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function remove(_x6) {
        return _ref6.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: 'removeById',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(id) {
        var url, request, response;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                url = (0, _http.formatKinveyBaasUrl)(this.pathname + '/' + id);
                request = createRequest(_http.RequestMethod.DELETE, url);
                _context7.next = 4;
                return (0, _http.execute)(request);

              case 4:
                response = _context7.sent;
                return _context7.abrupt('return', response.data);

              case 6:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function removeById(_x7) {
        return _ref7.apply(this, arguments);
      }

      return removeById;
    }()
  }, {
    key: 'pathname',
    get: function get() {
      return '/' + NAMESPACE + '/' + this.appKey + '/' + this.collectionName;
    }
  }]);

  return NetworkStore;
}(_datastore2.default);

exports.default = NetworkStore;