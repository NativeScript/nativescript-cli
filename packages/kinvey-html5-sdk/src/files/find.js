"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = find;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _isNumber = _interopRequireDefault(require("lodash/isNumber"));

var _config = require("../kinvey/config");

var _query = _interopRequireDefault(require("../query"));

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _downloadByUrl = _interopRequireDefault(require("./downloadByUrl"));

var NAMESPACE = 'blob';

function find() {
  return _find.apply(this, arguments);
}

function _find() {
  _find = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    var query,
        options,
        _getConfig,
        apiProtocol,
        apiHost,
        appKey,
        _options$download,
        download,
        _options$tls,
        tls,
        ttl,
        queryStringObject,
        request,
        response,
        files,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            query = _args.length > 0 && _args[0] !== undefined ? _args[0] : new _query.default();
            options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
            _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;
            _options$download = options.download, download = _options$download === void 0 ? false : _options$download, _options$tls = options.tls, tls = _options$tls === void 0 ? true : _options$tls, ttl = options.ttl;
            queryStringObject = Object.assign({}, {
              tls: tls === true
            });

            if (!query) {
              _context.next = 9;
              break;
            }

            if (query instanceof _query.default) {
              _context.next = 8;
              break;
            }

            throw new _kinvey.default('Invalid query. It must be an instance of the Query class.');

          case 8:
            queryStringObject = Object.assign({}, queryStringObject, query.toQueryObject());

          case 9:
            if ((0, _isNumber.default)(ttl)) {
              queryStringObject.ttl_in_seconds = parseInt(ttl, 10);
            }

            request = new _request.KinveyRequest({
              method: _request.RequestMethod.GET,
              auth: _auth.Auth.Default,
              url: (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(NAMESPACE, "/").concat(appKey), queryStringObject),
              timeout: options.timeout
            });
            _context.next = 13;
            return request.execute();

          case 13:
            response = _context.sent;
            files = response.data;

            if (!(download === true)) {
              _context.next = 17;
              break;
            }

            return _context.abrupt("return", Promise.all(files.map(function (file) {
              return (0, _downloadByUrl.default)(file._downloadURL, options);
            })));

          case 17:
            return _context.abrupt("return", files);

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _find.apply(this, arguments);
}