'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyRequest = exports.Request = exports.KinveyRequestConfig = exports.RequestConfig = exports.Properties = exports.Headers = exports.RequestMethod = exports.AuthType = undefined;

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rack = require('../rack/rack');

var _client = require('../client');

var _client2 = _interopRequireDefault(_client);

var _errors = require('../errors');

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

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Device = global.KinveyDevice;
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
var defaultTimeout = process.env.KINVEY_DEFAULT_TIMEOUT || 30;
var defaultApiVersion = process.env.KINVEY_DEFAULT_API_VERSION || 4;
var customPropertiesMaxBytesAllowed = process.env.KINVEY_MAX_HEADER_BYTES || 2000;

/**
 * @private
 */
function byteCount(str) {
  var count = 0;
  var stringLength = str.length;
  str = String(str || '');

  for (var i = 0; i < stringLength; i++) {
    var partCount = encodeURI(str[i]).split('%').length;
    count += partCount === 1 ? 1 : partCount - 1;
  }

  return count;
}

/**
 * Enum for Auth types.
 */
var AuthType = {
  All: 'All',
  App: 'App',
  Basic: 'Basic',
  Default: 'Default',
  Master: 'Master',
  None: 'None',
  Session: 'Session'
};
Object.freeze(AuthType);
exports.AuthType = AuthType;

/**
 * @private
 * Enum for Request Methods.
 */

var RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
Object.freeze(RequestMethod);
exports.RequestMethod = RequestMethod;


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
    var activeUser = client.activeUser;

    if (!activeUser) {
      throw new _errors.NoActiveUserError('There is not an active user. Please login a user and retry the request.');
    }

    return {
      scheme: 'Kinvey',
      credentials: activeUser[kmdAttribute].authtoken
    };
  }
};

var Headers = exports.Headers = function () {
  function Headers() {
    var headers = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Headers);

    this.addAll(headers);
  }

  _createClass(Headers, [{
    key: 'get',
    value: function get(name) {
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
    key: 'set',
    value: function set(name, value) {
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
    key: 'has',
    value: function has(name) {
      return !!this.get(name);
    }
  }, {
    key: 'add',
    value: function add() {
      var header = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return this.set(header.name, header.value);
    }
  }, {
    key: 'addAll',
    value: function addAll(headers) {
      var _this = this;

      if (!(0, _isPlainObject2.default)(headers)) {
        throw new Error('Headers argument must be an object.');
      }

      var names = Object.keys(headers);

      (0, _forEach2.default)(names, function (name) {
        var value = headers[name];
        _this.set(name, value);
      });
    }
  }, {
    key: 'remove',
    value: function remove(name) {
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
    key: 'clear',
    value: function clear() {
      this.headers = {};
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return this.headers;
    }
  }]);

  return Headers;
}();

var Properties = exports.Properties = function () {
  function Properties() {
    _classCallCheck(this, Properties);
  }

  _createClass(Properties, [{
    key: 'get',

    /**
     * Returns the request property for the key or `undefined` if
     * it has not been set.
     *
     * @param  {String} key Request property key
     * @return {*} Request property value
     */
    value: function get(key) {
      var properties = this.toJSON();

      if (key && properties.hasOwnProperty(key)) {
        return properties[key];
      }

      return undefined;
    }

    /**
     * Sets the request property key to the value.
     *
     * @param {String} key Request property key
     * @param {*} value Request property value
     * @return {RequestProperties} The request properties instance.
     */

  }, {
    key: 'set',
    value: function set(key, value) {
      var properties = {};
      properties[key] = value;
      this.addProperties(properties);
      return this;
    }
  }, {
    key: 'remove',
    value: function remove(key) {
      var properties = this.properties;

      if (key && properties.hasOwnProperty(key)) {
        delete properties[key];
      }
    }
  }, {
    key: 'has',
    value: function has(key) {
      return !!this.get(key);
    }
  }, {
    key: 'addProperties',
    value: function addProperties(properties) {
      var _this2 = this;

      if (!(0, _isPlainObject2.default)(properties)) {
        throw new _errors.KinveyError('properties argument must be an object');
      }

      Object.keys(properties).forEach(function (key) {
        var value = properties[key];

        if (value) {
          _this2.properties[key] = value;
        } else {
          delete _this2.properties[key];
        }
      });
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.properties = {};
    }
  }, {
    key: 'toString',
    value: function toString() {
      return JSON.stringify(this.properties);
    }
  }]);

  return Properties;
}();

var RequestConfig = exports.RequestConfig = function () {
  function RequestConfig() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, RequestConfig);

    options = (0, _assign2.default)({
      method: RequestMethod.GET,
      headers: new Headers(),
      url: '',
      body: null,
      timeout: defaultTimeout,
      followRedirect: true,
      noCache: false
    }, options);

    this.method = options.method;
    this.headers = options.headers;
    this.url = options.url;
    this.body = options.body;
    this.timeout = options.timeout;
    this.followRedirect = options.followRedirect;
    this.noCache = options.noCache;
  }

  _createClass(RequestConfig, [{
    key: 'method',
    get: function get() {
      return this.configMethod;
    },
    set: function set(method) {
      if (!(0, _isString2.default)(method)) {
        method = String(method);
      }

      method = method.toUpperCase();
      switch (method) {
        case RequestMethod.GET:
        case RequestMethod.POST:
        case RequestMethod.PATCH:
        case RequestMethod.PUT:
        case RequestMethod.DELETE:
          this.configMethod = method;
          break;
        default:
          throw new Error('Invalid request method. Only GET, POST, PATCH, PUT, and DELETE are allowed.');
      }
    }
  }, {
    key: 'headers',
    get: function get() {
      var headers = this.configHeaders;

      if (!headers.has('accept')) {
        headers.set('accept', 'application/json; charset=utf-8');
      }

      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json; charset=utf-8');
      }

      return headers;
    },
    set: function set(headers) {
      if (!(headers instanceof Headers)) {
        headers = new Headers((0, _result2.default)(headers, 'toJSON', headers));
      }

      this.configHeaders = headers;
    }
  }, {
    key: 'url',
    get: function get() {
      // Unless `noCache` is true, add a cache busting query string.
      // This is useful for Android < 4.0 which caches all requests aggressively.
      if (this.noCache) {
        return (0, _appendQuery2.default)(this.configUrl, _qs2.default.stringify({
          _: Math.random().toString(36).substr(2)
        }));
      }

      return this.configUrl;
    },
    set: function set(urlString) {
      this.configUrl = urlString;
    }
  }, {
    key: 'body',
    get: function get() {
      return this.configBody;
    },
    set: function set(body) {
      this.configBody = body;
    }
  }, {
    key: 'data',
    get: function get() {
      return this.body;
    },
    set: function set(data) {
      this.body = data;
    }
  }, {
    key: 'timeout',
    get: function get() {
      return this.configTimeout;
    },
    set: function set(timeout) {
      this.configTimeout = (0, _isNumber2.default)(timeout) ? timeout : defaultTimeout;
    }
  }, {
    key: 'followRedirect',
    get: function get() {
      return this.configFollowRedirect;
    },
    set: function set(followRedirect) {
      this.configFollowRedirect = !!followRedirect;
    }
  }, {
    key: 'noCache',
    get: function get() {
      return this.configNoCache;
    },
    set: function set(noCache) {
      this.configNoCache = !!noCache;
    }
  }]);

  return RequestConfig;
}();

var KinveyRequestConfig = exports.KinveyRequestConfig = function (_RequestConfig) {
  _inherits(KinveyRequestConfig, _RequestConfig);

  function KinveyRequestConfig() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, KinveyRequestConfig);

    var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyRequestConfig).call(this, options));

    options = (0, _assign2.default)({
      authType: AuthType.None,
      query: null,
      online: true,
      cacheEnabled: true,
      apiVersion: defaultApiVersion,
      properties: {},
      skipBL: false,
      trace: false,
      client: _client2.default.sharedInstance()
    }, options);

    _this3.authType = options.authType;
    _this3.query = options.query;
    _this3.online = options.online;
    _this3.cacheEnabled = options.cacheEnabled;
    _this3.timeout = options.timeout;
    _this3.apiVersion = options.apiVersion;
    _this3.properties = options.properties;
    _this3.client = options.client;
    var headers = _this3.headers;

    if (!headers.has('X-Kinvey-Api-Version')) {
      headers.set('X-Kinvey-Api-Version', _this3.apiVersion);
    }

    // if (options.contentType) {
    //   headers.set('X-Kinvey-Content-Type', options.contentType);
    // }

    if (options.skipBL === true) {
      headers.set('X-Kinvey-Skip-Business-Logic', true);
    }

    if (options.trace === true) {
      headers.set('X-Kinvey-Include-Headers-In-Response', 'X-Kinvey-Request-Id');
      headers.set('X-Kinvey-ResponseWrapper', true);
    }

    _this3.headers = headers;
    return _this3;
  }

  _createClass(KinveyRequestConfig, [{
    key: 'headers',
    get: function get() {
      var headers = _get(Object.getPrototypeOf(KinveyRequestConfig.prototype), 'headers', this);

      if (this.appVersion) {
        headers.set('X-Kinvey-Client-App-Version', this.appVersion);
      }

      if (this.properties) {
        var customPropertiesHeader = this.properties.toString();
        var customPropertiesByteCount = byteCount(customPropertiesHeader);

        if (customPropertiesByteCount >= customPropertiesMaxBytesAllowed) {
          throw new Error('The custom properties are ' + customPropertiesByteCount + ' bytes.' + ('It must be less then ' + customPropertiesMaxBytesAllowed + ' bytes.'), 'Please remove some custom properties.');
        }

        headers.set('X-Kinvey-Custom-Request-Properties', customPropertiesHeader);
      }

      if (Device) {
        headers.set('X-Kinvey-Device-Information', JSON.stringify(Device.toJSON()));
      }

      if (this.authType) {
        var authInfo = void 0;

        switch (this.authType) {
          case AuthType.All:
            authInfo = Auth.all(this.client);
            break;
          case AuthType.App:
            authInfo = Auth.app(this.client);
            break;
          case AuthType.Basic:
            authInfo = Auth.basic(this.client);
            break;
          case AuthType.Master:
            authInfo = Auth.master(this.client);
            break;
          case AuthType.None:
            authInfo = Auth.none(this.client);
            break;
          case AuthType.Session:
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

          headers.set('authorization', authInfo.scheme + ' ' + credentials);
        }
      }

      return headers;
    },
    set: function set(headers) {
      _set(Object.getPrototypeOf(KinveyRequestConfig.prototype), 'headers', headers, this);
    }
  }, {
    key: 'url',
    get: function get() {
      var urlString = _get(Object.getPrototypeOf(KinveyRequestConfig.prototype), 'url', this);
      var queryString = this.query ? this.query.toQueryString() : {};

      if ((0, _isEmpty2.default)(queryString)) {
        return urlString;
      }

      return (0, _appendQuery2.default)(urlString, _qs2.default.stringify(queryString));
    },
    set: function set(urlString) {
      _set(Object.getPrototypeOf(KinveyRequestConfig.prototype), 'url', urlString, this);
      var pathname = global.escape(_url2.default.parse(urlString).pathname);
      var pattern = new _urlPattern2.default('(/:namespace)(/)(:appKey)(/)(:collection)(/)(:entityId)(/)');

      var _ref = pattern.match(pathname) || {};

      var appKey = _ref.appKey;
      var collection = _ref.collection;
      var entityId = _ref.entityId;

      this.appKey = !!appKey ? global.unescape(appKey) : appKey;
      this.collection = !!collection ? global.unescape(collection) : collection;
      this.entityId = !!entityId ? global.unescape(entityId) : entityId;
    }
  }, {
    key: 'apiVersion',
    get: function get() {
      return this.configApiVersion;
    },
    set: function set(apiVersion) {
      this.configApiVersion = (0, _isNumber2.default)(apiVersion) ? apiVersion : defaultApiVersion;
    }
  }, {
    key: 'online',
    get: function get() {
      return this.configOnline;
    },
    set: function set(online) {
      this.configOnline = !!online;
    }
  }, {
    key: 'cacheEnabled',
    get: function get() {
      return this.configCacheEnabled;
    },
    set: function set(cacheEnabled) {
      this.configCacheEnabled = !!cacheEnabled;
    }
  }, {
    key: 'properties',
    get: function get() {
      return this.configProperties;
    },
    set: function set(properties) {
      this.configProperties = properties;
    }
  }, {
    key: 'client',
    get: function get() {
      return this.configClient;
    },
    set: function set(client) {
      if (client) {
        if (!(client instanceof _client2.default)) {
          throw new _errors.KinveyError('client must be an instance of the Client class.');
        }

        this.appVersion = client.appVersion;
      }

      this.configClient = client;
    }

    /**
     * Return the app version request property.
     *
     * @return {String} App version
     */

  }, {
    key: 'appVersion',
    get: function get() {
      return this.configAppVersion;
    }

    /**
     * Set the app version request property. The app version can be provided
     * in major.minor.patch format or something specific to your application.
     *
     * @param  {Any} version App version.
     * @return {RequestProperties} The request properties instance.
     */
    ,
    set: function set(args) {
      var version = Array.prototype.slice.call(args, 1);
      var major = args[0];
      var minor = version[1];
      var patch = version[2];
      var appVersion = '';

      if (major) {
        appVersion = ('' + major).trim();
      }

      if (minor) {
        appVersion = ('.' + minor).trim();
      }

      if (patch) {
        appVersion = ('.' + patch).trim();
      }

      this.configAppVersion = appVersion;
    }
  }]);

  return KinveyRequestConfig;
}(RequestConfig);

/**
 * @private
 */


var Request = exports.Request = function () {
  function Request() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? new RequestConfig() : arguments[0];

    _classCallCheck(this, Request);

    this.config = config;
    this.executing = false;
  }

  _createClass(Request, [{
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
        headers: this.headers.toJSON(),
        url: this.url,
        body: this.body,
        data: this.body
      };

      return json;
    }
  }, {
    key: 'config',
    get: function get() {
      return this.requestConfig;
    },
    set: function set(config) {
      if (config && !(config instanceof RequestConfig)) {
        config = new RequestConfig((0, _result2.default)(config, 'toJSON', config));
      }

      this.requestConfig = config;
    }
  }, {
    key: 'method',
    get: function get() {
      return this.config.method;
    },
    set: function set(method) {
      this.config.method = method;
    }
  }, {
    key: 'headers',
    get: function get() {
      return this.config.headers;
    },
    set: function set(headers) {
      this.config.headers = headers;
    }
  }, {
    key: 'url',
    get: function get() {
      return this.config.url;
    },
    set: function set(urlString) {
      this.config.url = urlString;
    }
  }, {
    key: 'body',
    get: function get() {
      return this.config.body;
    },
    set: function set(body) {
      this.config.body = body;
    }
  }, {
    key: 'data',
    get: function get() {
      return this.body;
    },
    set: function set(data) {
      this.body = data;
    }
  }]);

  return Request;
}();

/**
 * @private
 */


var KinveyRequest = exports.KinveyRequest = function (_Request) {
  _inherits(KinveyRequest, _Request);

  function KinveyRequest(config) {
    _classCallCheck(this, KinveyRequest);

    var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyRequest).call(this, config));

    _this4.rack = new _rack.KinveyRack();
    return _this4;
  }

  _createClass(KinveyRequest, [{
    key: 'toJSON',
    value: function toJSON() {
      var json = _get(Object.getPrototypeOf(KinveyRequest.prototype), 'toJSON', this).call(this);
      json.query = this.query;
      return json;
    }
  }, {
    key: 'config',
    get: function get() {
      return _get(Object.getPrototypeOf(KinveyRequest.prototype), 'config', this);
    },
    set: function set(config) {
      if (config && !(config instanceof KinveyRequestConfig)) {
        config = new KinveyRequestConfig((0, _result2.default)(config, 'toJSON', config));
      }

      _set(Object.getPrototypeOf(KinveyRequest.prototype), 'config', config, this);
    }
  }, {
    key: 'query',
    get: function get() {
      return this.config.query;
    },
    set: function set(query) {
      this.config.query = query;
    }
  }, {
    key: 'appKey',
    get: function get() {
      return this.config.appKey;
    }
  }, {
    key: 'collection',
    get: function get() {
      return this.config.collection;
    }
  }, {
    key: 'entityId',
    get: function get() {
      return this.config.entityId;
    }
  }]);

  return KinveyRequest;
}(Request);