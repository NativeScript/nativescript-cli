'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyRequest = exports.Properties = exports.AuthType = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('./request');

var _networkrequest = require('./networkrequest');

var _kinveyresponse = require('./kinveyresponse');

var _errors = require('../../errors');

var _client = require('../../client');

var _social = require('../../social');

var _utils = require('../../utils');

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _appendQuery = require('append-query');

var _appendQuery2 = _interopRequireDefault(_appendQuery);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line no-unused-vars


var socialIdentityAttribute = process.env.KINVEY_SOCIAL_IDENTITY_ATTRIBUTE || '_socialIdentity';
var tokenPathname = process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token';
var usersNamespace = process.env.KINVEY_USERS_NAMESPACE || 'user';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';
var defaultApiVersion = process.env.KINVEY_DEFAULT_API_VERSION || 4;
var customPropertiesMaxBytesAllowed = process.env.KINVEY_MAX_HEADER_BYTES || 2000;

/**
 * @private
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
      throw new Error('Missing client appKey and/or appSecret.' + ' Use Kinvey.init() to set the appKey and appSecret for the client.');
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
      throw new Error('Missing client appKey and/or appSecret.' + ' Use Kinvey.init() to set the appKey and appSecret for the client.');
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

/**
 * @private
 */
function byteCount(str) {
  if (str) {
    var count = 0;
    var stringLength = str.length;
    str = String(str || '');

    for (var i = 0; i < stringLength; i++) {
      var partCount = encodeURI(str[i]).split('%').length;
      count += partCount === 1 ? 1 : partCount - 1;
    }

    return count;
  }

  return 0;
}

/**
 * @private
 */

var Properties = exports.Properties = function (_Headers) {
  _inherits(Properties, _Headers);

  function Properties() {
    _classCallCheck(this, Properties);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Properties).apply(this, arguments));
  }

  return Properties;
}(_request.Headers);

var KinveyRequest = exports.KinveyRequest = function (_NetworkRequest) {
  _inherits(KinveyRequest, _NetworkRequest);

  function KinveyRequest() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, KinveyRequest);

    // Set default options
    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyRequest).call(this, options));

    options = (0, _assign2.default)({
      authType: AuthType.None,
      query: null,
      apiVersion: defaultApiVersion,
      properties: new Properties(),
      skipBL: false,
      trace: false,
      client: _client.Client.sharedInstance()
    }, options);

    _this2.authType = options.authType;
    _this2.query = options.query;
    _this2.apiVersion = options.apiVersion;
    _this2.properties = options.properties;
    _this2.client = options.client;
    _this2.skipBL = options.skipBL;
    _this2.trace = options.trace;
    return _this2;
  }

  _createClass(KinveyRequest, [{
    key: 'execute',
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee() {
        var rawResponse = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];
        var response, micSession, refreshMICRequest, newMicSession, data, loginRequest, activeUser;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return _get(Object.getPrototypeOf(KinveyRequest.prototype), 'execute', this).call(this);

              case 3:
                response = _context.sent;


                if (!(response instanceof _kinveyresponse.KinveyResponse)) {
                  response = new _kinveyresponse.KinveyResponse({
                    statusCode: response.statusCode,
                    headers: response.headers,
                    data: response.data
                  });
                }

                if (!(rawResponse === false && response.isSuccess() === false)) {
                  _context.next = 7;
                  break;
                }

                throw response.error;

              case 7:
                return _context.abrupt('return', response);

              case 10:
                _context.prev = 10;
                _context.t0 = _context['catch'](0);

                if (!(_context.t0 instanceof _errors.InvalidCredentialsError)) {
                  _context.next = 30;
                  break;
                }

                // Retrieve the MIC session
                micSession = (0, _utils.getIdentitySession)(this.client, _social.SocialIdentity.MobileIdentityConnect);

                if (!micSession) {
                  _context.next = 30;
                  break;
                }

                // Refresh MIC Auth Token
                refreshMICRequest = new KinveyRequest({
                  method: _request.RequestMethod.POST,
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                  },
                  authType: AuthType.App,
                  url: _url2.default.format({
                    protocol: micSession.protocol || this.client.micProtocol,
                    host: micSession.host || this.client.micHost,
                    pathname: tokenPathname
                  }),
                  body: {
                    grant_type: 'refresh_token',
                    client_id: micSession.client_id,
                    redirect_uri: micSession.redirect_uri,
                    refresh_token: micSession.refresh_token
                  },
                  timeout: this.timeout,
                  properties: this.properties
                });
                _context.next = 18;
                return refreshMICRequest.execute().then(function (response) {
                  return response.data;
                });

              case 18:
                newMicSession = _context.sent;

                micSession = (0, _assign2.default)(micSession, newMicSession);

                // Login the user with the new mic session
                data = {};

                data[socialIdentityAttribute] = {};
                data[socialIdentityAttribute][_social.SocialIdentity.MobileIdentityConnect] = micSession;

                // Login the user
                loginRequest = new KinveyRequest({
                  method: _request.RequestMethod.POST,
                  authType: AuthType.App,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: '/' + usersNamespace + '/' + this.client.appKey + '/login'
                  }),
                  properties: this.properties,
                  body: data,
                  timeout: this.timeout,
                  client: this.client
                });
                _context.next = 26;
                return loginRequest.execute().then(function (response) {
                  return response.data;
                });

              case 26:
                activeUser = _context.sent;


                // Store the updated active user
                (0, _utils.setActiveUser)(this.client, activeUser);

                // Store the updated mic session
                (0, _utils.setIdentitySession)(this.client, _social.SocialIdentity.MobileIdentityConnect, micSession);

                // Execute the original request
                return _context.abrupt('return', this.execute(rawResponse));

              case 30:
                throw _context.t0;

              case 31:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 10]]);
      }));

      function execute(_x2) {
        return _ref.apply(this, arguments);
      }

      return execute;
    }()
  }, {
    key: 'headers',
    get: function get() {
      var headers = _get(Object.getPrototypeOf(KinveyRequest.prototype), 'headers', this);

      // Add the Accept header
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json; charset=utf-8');
      }

      // Add the Content-Type header
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json; charset=utf-8');
      }

      // Add the X-Kinvey-API-Version header
      if (!headers.has('X-Kinvey-Api-Version')) {
        headers.set('X-Kinvey-Api-Version', this.apiVersion);
      }

      // Add or remove the X-Kinvey-Skip-Business-Logic header
      if (this.skipBL === true) {
        headers.set('X-Kinvey-Skip-Business-Logic', true);
      } else {
        headers.remove('X-Kinvey-Skip-Business-Logic');
      }

      // Add or remove the X-Kinvey-Include-Headers-In-Response and X-Kinvey-ResponseWrapper headers
      if (this.trace === true) {
        headers.set('X-Kinvey-Include-Headers-In-Response', 'X-Kinvey-Request-Id');
        headers.set('X-Kinvey-ResponseWrapper', true);
      } else {
        headers.remove('X-Kinvey-Include-Headers-In-Response');
        headers.remove('X-Kinvey-ResponseWrapper');
      }

      // Add or remove the X-Kinvey-Client-App-Version header
      if (this.appVersion) {
        headers.set('X-Kinvey-Client-App-Version', this.appVersion);
      } else {
        headers.remove('X-Kinvey-Client-App-Version');
      }

      // Add or remove X-Kinvey-Custom-Request-Properties header
      if (this.properties) {
        var customPropertiesHeader = this.properties.toString();

        if (!(0, _isEmpty2.default)(customPropertiesHeader)) {
          var customPropertiesByteCount = byteCount(customPropertiesHeader);

          if (customPropertiesByteCount >= customPropertiesMaxBytesAllowed) {
            throw new Error('The custom properties are ' + customPropertiesByteCount + ' bytes.' + ('It must be less then ' + customPropertiesMaxBytesAllowed + ' bytes.'), 'Please remove some custom properties.');
          }

          headers.set('X-Kinvey-Custom-Request-Properties', customPropertiesHeader);
        } else {
          headers.remove('X-Kinvey-Custom-Request-Properties');
        }
      } else {
        headers.remove('X-Kinvey-Custom-Request-Properties');
      }

      // Add the X-Kinvey-Device-Information header
      headers.set('X-Kinvey-Device-Information', _utils.Device.toString());

      // Add or remove the Authorization header
      if (this.authType) {
        var authInfo = void 0;

        // Get the auth info based on the set AuthType
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

        // Add the auth info to the Authorization header
        if (authInfo) {
          var credentials = authInfo.credentials;

          if (authInfo.username) {
            credentials = new Buffer(authInfo.username + ':' + authInfo.password).toString('base64');
          }

          headers.set('Authorization', authInfo.scheme + ' ' + credentials);
        }
      } else {
        headers.remove('Authorization');
      }

      // Return the headers
      return headers;
    },
    set: function set(headers) {
      _set(Object.getPrototypeOf(KinveyRequest.prototype), 'headers', headers, this);
    }
  }, {
    key: 'url',
    get: function get() {
      var urlString = _get(Object.getPrototypeOf(KinveyRequest.prototype), 'url', this);
      var queryString = this.query ? this.query.toQueryString() : {};

      if ((0, _isEmpty2.default)(queryString)) {
        return urlString;
      }

      return (0, _appendQuery2.default)(urlString, _qs2.default.stringify(queryString));
    },
    set: function set(urlString) {
      _set(Object.getPrototypeOf(KinveyRequest.prototype), 'url', urlString, this);
    }
  }, {
    key: 'apiVersion',
    get: function get() {
      return this._apiVersion;
    },
    set: function set(apiVersion) {
      this._apiVersion = (0, _isNumber2.default)(apiVersion) ? apiVersion : defaultApiVersion;
    }
  }, {
    key: 'properties',
    get: function get() {
      return this._properties;
    },
    set: function set(properties) {
      if (properties && !(properties instanceof Properties)) {
        properties = new Properties(properties);
      }

      this._properties = properties;
    }
  }, {
    key: 'client',
    get: function get() {
      return this._client;
    },
    set: function set(client) {
      if (client) {
        if (!(client instanceof _client.Client)) {
          throw new _errors.KinveyError('client must be an instance of the Client class.');
        }

        this.appVersion = client.appVersion;
      }

      this._client = client;
    }
  }]);

  return KinveyRequest;
}(_networkrequest.NetworkRequest);