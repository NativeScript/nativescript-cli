'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyRequest = exports.Request = undefined;

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _enums = require('../enums');

var _device = require('../utils/device');

var _properties = require('./properties');

var _rack = require('../rack/rack');

var _client = require('../client');

var _errors = require('../errors');

var _string = require('../utils/string');

var _urlPattern = require('url-pattern');

var _urlPattern2 = _interopRequireDefault(_urlPattern);

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _appendQuery = require('append-query');

var _appendQuery2 = _interopRequireDefault(_appendQuery);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var kmdAttribute = undefined || '_kmd';

var Auth = {
  /**
   * Authenticate through (1) user credentials, (2) Master Secret, or (3) App
   * Secret.
   *
   * @returns {Object}
   */

  all: function all(client) {
    try {
      return Auth.session(client);
    } catch (error) {
      return Auth.basic(client);
    }
  },


  /**
   * Authenticate through App Secret.
   *
   * @returns {Object}
   */
  app: function app(client) {
    if (!client.appKey || !client.appSecret) {
      throw new Error('Missing client credentials');
    }

    return {
      scheme: 'Basic',
      username: client.appKey,
      password: client.appSecret
    };
  },


  /**
   * Authenticate through (1) Master Secret, or (2) App Secret.
   *
   * @returns {Object}
   */
  basic: function basic(client) {
    try {
      return Auth.master(client);
    } catch (error) {
      return Auth.app(client);
    }
  },


  /**
   * Authenticate through Master Secret.
   *
   * @returns {Object}
   */
  master: function master(client) {
    if (!client.appKey || !client.masterSecret) {
      throw new Error('Missing client credentials');
    }

    return {
      scheme: 'Basic',
      username: client.appKey,
      password: client.masterSecret
    };
  },


  /**
   * Do not authenticate.
   *
   * @returns {Null}
   */
  none: function none() {
    return null;
  },


  /**
   * Authenticate through user credentials.
   *
   * @returns {Object}
   */
  session: function session(client) {
    var activeUser = client.user;

    if (!activeUser) {
      throw new _errors.NoActiveUserError('There is not an active user. Please login a user and retry the request.');
    }

    return {
      scheme: 'Kinvey',
      credentials: activeUser[kmdAttribute].authtoken
    };
  }
};

/**
 * @private
 */

var Request = exports.Request = function () {
  function Request() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Request);

    options = (0, _assign2.default)({
      method: _enums.HttpMethod.GET,
      headers: {},
      url: '',
      data: null,
      timeout: undefined || 10000,
      followRedirect: true
    }, options);

    this.method = options.method;
    this.url = options.url;
    this.data = options.data || options.body;
    this.timeout = options.timeout;
    this.followRedirect = options.followRedirect;
    this.executing = false;

    var headers = options.headers && (0, _isPlainObject2.default)(options.headers) ? options.headers : {};

    if (!headers.Accept || !headers.accept) {
      headers.Accept = 'application/json; charset=utf-8';
    }

    this.addHeaders(headers);
  }

  _createClass(Request, [{
    key: 'getHeader',
    value: function getHeader(name) {
      if (name) {
        if (!(0, _isString2.default)(name)) {
          name = String(name);
        }

        var headers = this.headers || {};
        var keys = Object.keys(headers);

        for (var i = 0, len = keys.length; i < len; i++) {
          var key = keys[i];

          if (key.toLowerCase() === name.toLowerCase()) {
            return headers[key];
          }
        }
      }

      return undefined;
    }
  }, {
    key: 'setHeader',
    value: function setHeader(name, value) {
      if (!name || !value) {
        throw new Error('A name and value must be provided to set a header.');
      }

      if (!(0, _isString2.default)(name)) {
        name = String(name);
      }

      var headers = this.headers || {};

      if (!(0, _isString2.default)(value)) {
        headers[name] = JSON.stringify(value);
      } else {
        headers[name] = value;
      }

      this.headers = headers;
    }
  }, {
    key: 'addHeader',
    value: function addHeader() {
      var header = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this.setHeader(header.name, header.value);
    }
  }, {
    key: 'addHeaders',
    value: function addHeaders(headers) {
      var _this = this;

      if (!(0, _isPlainObject2.default)(headers)) {
        throw new Error('Headers argument must be an object.');
      }

      var names = Object.keys(headers);

      (0, _forEach2.default)(names, function (name) {
        var value = headers[name];
        _this.setHeader(name, value);
      });
    }
  }, {
    key: 'removeHeader',
    value: function removeHeader(name) {
      if (name) {
        if (!(0, _isString2.default)(name)) {
          name = String(name);
        }

        var headers = this.headers || {};
        delete headers[name];
        this.headers = headers;
      }
    }
  }, {
    key: 'clearHeaders',
    value: function clearHeaders() {
      this.headers = {};
    }
  }, {
    key: 'isExecuting',
    value: function isExecuting() {
      return !!this.executing;
    }
  }, {
    key: 'execute',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.isExecuting()) {
                  _context.next = 2;
                  break;
                }

                throw new Error('Unable to execute the request. The request is already executing.');

              case 2:

                // Flip the executing flag to true
                this.executing = true;

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function execute() {
        return ref.apply(this, arguments);
      }

      return execute;
    }()
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = {
        method: this.method,
        headers: this.headers,
        url: this.url,
        data: this.data,
        followRedirect: this.followRedirect
      };

      return json;
    }
  }, {
    key: 'method',
    get: function get() {
      return this._method;
    },
    set: function set(method) {
      if (!(0, _isString2.default)(method)) {
        method = String(method);
      }

      method = method.toUpperCase();

      switch (method) {
        case _enums.HttpMethod.GET:
        case _enums.HttpMethod.POST:
        case _enums.HttpMethod.PATCH:
        case _enums.HttpMethod.PUT:
        case _enums.HttpMethod.DELETE:
          this._method = method;
          break;
        default:
          throw new Error('Invalid Http Method. Only GET, POST, PATCH, PUT, and DELETE are allowed.');
      }
    }
  }, {
    key: 'url',
    get: function get() {
      return (0, _appendQuery2.default)(this._url, _qs2.default.stringify({
        _: Math.random().toString(36).substr(2)
      }));
    },
    set: function set(urlString) {
      this._url = urlString;
    }
  }, {
    key: 'body',
    get: function get() {
      return this.data;
    },
    set: function set(body) {
      this.data = body;
    }
  }, {
    key: 'data',
    get: function get() {
      return this._data;
    },
    set: function set(data) {
      if (data) {
        var contentTypeHeader = this.getHeader('Content-Type');
        if (!contentTypeHeader) {
          this.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
      } else {
        this.removeHeader('Content-Type');
      }

      this._data = data;
    }
  }]);

  return Request;
}();

/**
 * @private
 */


var KinveyRequest = exports.KinveyRequest = function (_Request) {
  _inherits(KinveyRequest, _Request);

  function KinveyRequest() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, KinveyRequest);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyRequest).call(this, options));

    options = (0, _assign2.default)({
      authType: _enums.AuthType.None,
      properties: null,
      query: null,
      client: _client.Client.sharedInstance()
    }, options);

    _this2.rack = new _rack.KinveyRack();
    _this2.authType = options.authType;
    _this2.properties = options.properties;
    _this2.query = (0, _result2.default)(options.query, 'toJSON', options.query);
    _this2.client = options.client;

    var headers = {};
    headers['X-Kinvey-Api-Version'] = undefined || 3;
    headers['X-Kinvey-Device-Information'] = JSON.stringify(_device.Device.toJSON());

    if (options.contentType) {
      headers['X-Kinvey-Content-Type'] = options.contentType;
    }

    if (options.skipBL === true) {
      headers['X-Kinvey-Skip-Business-Logic'] = true;
    }

    if (options.trace === true) {
      headers['X-Kinvey-Include-Headers-In-Response'] = 'X-Kinvey-Request-Id';
      headers['X-Kinvey-ResponseWrapper'] = true;
    }

    _this2.addHeaders(headers);
    return _this2;
  }

  _createClass(KinveyRequest, [{
    key: 'execute',
    value: function execute() {
      var authorizationHeader = this.authorizationHeader;

      if (authorizationHeader) {
        this.addHeader(authorizationHeader);
      }

      return _get(Object.getPrototypeOf(KinveyRequest.prototype), 'execute', this).call(this);
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      return _get(Object.getPrototypeOf(KinveyRequest.prototype), 'cancel', this).call(this);
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      var json = _get(Object.getPrototypeOf(KinveyRequest.prototype), 'toJSON', this).call(this);
      json.query = this.query;
      return json;
    }
  }, {
    key: 'properties',
    set: function set(properties) {
      if (properties) {
        if (!(properties instanceof _properties.RequestProperties)) {
          properties = new _properties.RequestProperties((0, _result2.default)(properties, 'toJSON', properties));
        }

        var appVersion = properties.appVersion;

        if (appVersion) {
          this.setHeader('X-Kinvey-Client-App-Version', appVersion);
        } else {
          this.removeHeader('X-Kinvey-Client-App-Version');
        }

        var customProperties = (0, _result2.default)(properties, 'toJSON', {});
        delete customProperties.appVersion;
        var customPropertiesHeader = JSON.stringify(customProperties);
        var customPropertiesByteCount = (0, _string.byteCount)(customPropertiesHeader);
        var customPropertiesMaxBytesAllowed = undefined || 2000;

        if (customPropertiesByteCount >= customPropertiesMaxBytesAllowed) {
          throw new Error('The custom properties are ' + customPropertiesByteCount + ' bytes.' + ('It must be less then ' + customPropertiesMaxBytesAllowed + ' bytes.'), 'Please remove some custom properties.');
        }

        this.setHeader('X-Kinvey-Custom-Request-Properties', customPropertiesHeader);
      }
    }
  }, {
    key: 'url',
    get: function get() {
      var urlString = _get(Object.getPrototypeOf(KinveyRequest.prototype), 'url', this);
      var queryString = {};

      if (this.query) {
        queryString.query = this.query.filter;

        if (!(0, _isEmpty2.default)(this.query.fields)) {
          queryString.fields = this.query.fields.join(',');
        }

        if (this.query.limit) {
          queryString.limit = this.query.limit;
        }

        if (this.query.skip > 0) {
          queryString.skip = this.query.skip;
        }

        if (!(0, _isEmpty2.default)(this.query.sort)) {
          queryString.sort = this.query.sort;
        }
      }

      var keys = Object.keys(queryString);
      (0, _forEach2.default)(keys, function (key) {
        queryString[key] = (0, _isString2.default)(queryString[key]) ? queryString[key] : JSON.stringify(queryString[key]);
      });

      if ((0, _isEmpty2.default)(queryString)) {
        return urlString;
      }

      return (0, _appendQuery2.default)(urlString, _qs2.default.stringify(queryString));
    },
    set: function set(urlString) {
      _set(Object.getPrototypeOf(KinveyRequest.prototype), 'url', urlString, this);

      var pathname = global.escape(_url2.default.parse(urlString).pathname);
      var pattern = new _urlPattern2.default('(/:namespace)(/)(:appKey)(/)(:collectionName)(/)(:entityId)(/)');

      var _ref = pattern.match(pathname) || {};

      var appKey = _ref.appKey;
      var collectionName = _ref.collectionName;
      var entityId = _ref.entityId;

      this.appKey = !!appKey ? global.unescape(appKey) : appKey;
      this.collectionName = !!collectionName ? global.unescape(collectionName) : collectionName;
      this.entityId = !!entityId ? global.unescape(entityId) : entityId;
    }
  }, {
    key: 'authorizationHeader',
    get: function get() {
      var authInfo = void 0;

      switch (this.authType) {
        case _enums.AuthType.All:
          authInfo = Auth.all(this.client);
          break;
        case _enums.AuthType.App:
          authInfo = Auth.app(this.client);
          break;
        case _enums.AuthType.Basic:
          authInfo = Auth.basic(this.client);
          break;
        case _enums.AuthType.Master:
          authInfo = Auth.master(this.client);
          break;
        case _enums.AuthType.None:
          authInfo = Auth.none(this.client);
          break;
        case _enums.AuthType.Session:
          authInfo = Auth.session(this.client);
          break;
        default:
          try {
            authInfo = Auth.session(this.client);
          } catch (error) {
            try {
              authInfo = Auth.master(this.client);
            } catch (error2) {
              throw error;
            }
          }
      }

      if (authInfo) {
        var credentials = authInfo.credentials;

        if (authInfo.username) {
          credentials = new Buffer(authInfo.username + ':' + authInfo.password).toString('base64');
        }

        return {
          name: 'Authorization',
          value: authInfo.scheme + ' ' + credentials
        };
      }

      return null;
    }
  }]);

  return KinveyRequest;
}(Request);