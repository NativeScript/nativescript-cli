"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = lookup;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _rxjs = require("rxjs");

var _query = _interopRequireDefault(require("../query"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _config = require("../kinvey/config");

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var USER_NAMESPACE = 'user';

function lookup(query) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var stream = _rxjs.Observable.create(
  /*#__PURE__*/
  function () {
    var _ref = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/
    _regenerator.default.mark(function _callee(observer) {
      var _getConfig, apiProtocol, apiHost, appKey, request, response;

      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;

              if (!(query && !(query instanceof _query.default))) {
                _context.next = 3;
                break;
              }

              throw new _kinvey.default('Invalid query. It must be an instance of the Query class.');

            case 3:
              _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;
              request = new _request.KinveyRequest({
                method: _request.RequestMethod.POST,
                auth: _auth.Auth.Default,
                url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(USER_NAMESPACE, "/").concat(appKey, "/_lookup")),
                body: query ? query.filter : undefined,
                timeout: options.timeout
              });
              _context.next = 7;
              return request.execute();

            case 7:
              response = _context.sent;
              observer.next(response.data);
              observer.complete();
              _context.next = 15;
              break;

            case 12:
              _context.prev = 12;
              _context.t0 = _context["catch"](0);
              observer.error(_context.t0);

            case 15:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this, [[0, 12]]);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());

  return stream;
}