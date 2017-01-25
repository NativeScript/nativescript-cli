'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyRequest = exports.Properties = exports.AuthType = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

var _local = require('./local');

var _local2 = _interopRequireDefault(_local);

var _headers = require('./headers');

var _headers2 = _interopRequireDefault(_headers);

var _response = require('./response');

var _query = require('../../query');

var _query2 = _interopRequireDefault(_query);

var _aggregation = require('../../aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _utils = require('../../utils');

var _errors = require('../../errors');

var _identity = require('../../identity');

var _rack = require('./rack');

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _device = require('./device');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _appendQuery = require('append-query');

var _appendQuery2 = _interopRequireDefault(_appendQuery);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _defaults = require('lodash/defaults');

var _defaults2 = _interopRequireDefault(_defaults);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var tokenPathname = process && process.env && process.env.KINVEY_MIC_TOKEN_PATHNAME || '/oauth/token' || '/oauth/token';
var usersNamespace = process && process.env && process.env.KINVEY_USERS_NAMESPACE || 'user' || 'user';
var defaultApiVersion = process && process.env && process.env.KINVEY_DEFAULT_API_VERSION || '4' || 4;
var customPropertiesMaxBytesAllowed = process && process.env && process.env.KINVEY_MAX_HEADER_BYTES || '2000' || 2000;

var NetworkRequest = function (_Request) {
  _inherits(NetworkRequest, _Request);

  function NetworkRequest() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, NetworkRequest);

    var _this = _possibleConstructorReturn(this, (NetworkRequest.__proto__ || Object.getPrototypeOf(NetworkRequest)).call(this, options));

    _this.rack = new _rack.NetworkRack();
    return _this;
  }

  return NetworkRequest;
}(_request2.default);

exports.default = NetworkRequest;

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
  all: function all(client) {
    return Auth.session(client).catch(function () {
      return Auth.basic(client);
    });
  },
  app: function app(client) {
    if (!client.appKey || !client.appSecret) {
      return _es6Promise2.default.reject(new Error('Missing client appKey and/or appSecret.' + ' Use Kinvey.init() to set the appKey and appSecret for the client.'));
    }

    return _es6Promise2.default.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.appSecret
    });
  },
  basic: function basic(client) {
    return Auth.master(client).catch(function () {
      return Auth.app(client);
    });
  },
  master: function master(client) {
    if (!client.appKey || !client.masterSecret) {
      return _es6Promise2.default.reject(new Error('Missing client appKey and/or appSecret.' + ' Use Kinvey.init() to set the appKey and appSecret for the client.'));
    }

    return _es6Promise2.default.resolve({
      scheme: 'Basic',
      username: client.appKey,
      password: client.masterSecret
    });
  },
  none: function none() {
    return _es6Promise2.default.resolve(null);
  },
  session: function session(client) {
    var activeUser = _local2.default.getActiveUser(client);

    if (!(0, _utils.isDefined)(activeUser)) {
      return _es6Promise2.default.reject(new _errors.NoActiveUserError('There is not an active user. Please login a user and retry the request.'));
    }

    return _es6Promise2.default.resolve({
      scheme: 'Kinvey',
      credentials: activeUser._kmd.authtoken
    });
  }
};

function byteCount(str) {
  if (str) {
    var count = 0;
    var stringLength = str.length;
    str = String(str || '');

    for (var i = 0; i < stringLength; i += 1) {
      var partCount = encodeURI(str[i]).split('%').length;
      count += partCount === 1 ? 1 : partCount - 1;
    }

    return count;
  }

  return 0;
}

var Properties = exports.Properties = function (_Headers) {
  _inherits(Properties, _Headers);

  function Properties() {
    _classCallCheck(this, Properties);

    return _possibleConstructorReturn(this, (Properties.__proto__ || Object.getPrototypeOf(Properties)).apply(this, arguments));
  }

  return Properties;
}(_headers2.default);

var KinveyRequest = exports.KinveyRequest = function (_NetworkRequest) {
  _inherits(KinveyRequest, _NetworkRequest);

  function KinveyRequest() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, KinveyRequest);

    var _this3 = _possibleConstructorReturn(this, (KinveyRequest.__proto__ || Object.getPrototypeOf(KinveyRequest)).call(this, options));

    options = (0, _assign2.default)({
      skipBL: false,
      trace: false
    }, options);

    _this3.authType = options.authType || AuthType.None;
    _this3.query = options.query;
    _this3.aggregation = options.aggregation;
    _this3.properties = options.properties || new Properties();
    _this3.skipBL = options.skipBL === true;
    _this3.trace = options.trace === true;
    return _this3;
  }

  _createClass(KinveyRequest, [{
    key: 'getAuthorizationHeader',
    value: function getAuthorizationHeader() {
      var _this4 = this;

      var promise = _es6Promise2.default.resolve(undefined);

      if (this.authType) {
        switch (this.authType) {
          case AuthType.All:
            promise = Auth.all(this.client);
            break;
          case AuthType.App:
            promise = Auth.app(this.client);
            break;
          case AuthType.Basic:
            promise = Auth.basic(this.client);
            break;
          case AuthType.Master:
            promise = Auth.master(this.client);
            break;
          case AuthType.None:
            promise = Auth.none(this.client);
            break;
          case AuthType.Session:
            promise = Auth.session(this.client);
            break;
          default:
            promise = Auth.session(this.client).catch(function (error) {
              return Auth.master(_this4.client).catch(function () {
                throw error;
              });
            });
        }
      }

      return promise.then(function (authInfo) {
        if ((0, _utils.isDefined)(authInfo)) {
          var credentials = authInfo.credentials;

          if (authInfo.username) {
            credentials = new Buffer(authInfo.username + ':' + authInfo.password).toString('base64');
          }

          return authInfo.scheme + ' ' + credentials;
        }

        return undefined;
      });
    }
  }, {
    key: 'execute',
    value: function execute() {
      var _this5 = this;

      var rawResponse = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var retry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      return this.getAuthorizationHeader().then(function (authorizationHeader) {
        if ((0, _utils.isDefined)(authorizationHeader)) {
          _this5.headers.set('Authorization', authorizationHeader);
        } else {
          _this5.headers.remove('Authorization');
        }
      }).then(function () {
        return _get(KinveyRequest.prototype.__proto__ || Object.getPrototypeOf(KinveyRequest.prototype), 'execute', _this5).call(_this5);
      }).then(function (response) {
        if (!(response instanceof _response.KinveyResponse)) {
          response = new _response.KinveyResponse({
            statusCode: response.statusCode,
            headers: response.headers,
            data: response.data
          });
        }

        if (rawResponse === false && response.isSuccess() === false) {
          throw response.error;
        }

        return response;
      }).catch(function (error) {
        if (error instanceof _errors.InvalidCredentialsError && retry === true) {
          var _ret = function () {
            var activeUser = _local2.default.getActiveUser(_this5.client);

            if (!(0, _utils.isDefined)(activeUser)) {
              throw error;
            }

            var socialIdentities = (0, _utils.isDefined)(activeUser._socialIdentity) ? activeUser._socialIdentity : {};
            var sessionKey = Object.keys(socialIdentities).find(function (sessionKey) {
              return socialIdentities[sessionKey].identity === _identity.SocialIdentity.MobileIdentityConnect;
            });
            var session = socialIdentities[sessionKey];

            if ((0, _utils.isDefined)(session)) {
              if (session.identity === _identity.SocialIdentity.MobileIdentityConnect) {
                var refreshMICRequest = new KinveyRequest({
                  method: _request.RequestMethod.POST,
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                  },
                  authType: AuthType.App,
                  url: _url2.default.format({
                    protocol: session.protocol || _this5.client.micProtocol,
                    host: session.host || _this5.client.micHost,
                    pathname: tokenPathname
                  }),
                  body: {
                    grant_type: 'refresh_token',
                    client_id: session.client_id,
                    redirect_uri: session.redirect_uri,
                    refresh_token: session.refresh_token
                  },
                  timeout: _this5.timeout,
                  properties: _this5.properties
                });

                return {
                  v: refreshMICRequest.execute().then(function (response) {
                    return response.data;
                  }).then(function (newSession) {
                    var data = {};
                    data._socialIdentity = {};
                    data._socialIdentity[session.identity] = newSession;

                    var loginRequest = new KinveyRequest({
                      method: _request.RequestMethod.POST,
                      authType: AuthType.App,
                      url: _url2.default.format({
                        protocol: _this5.client.protocol,
                        host: _this5.client.host,
                        pathname: '/' + usersNamespace + '/' + _this5.client.appKey + '/login'
                      }),
                      properties: _this5.properties,
                      body: data,
                      timeout: _this5.timeout,
                      client: _this5.client
                    });
                    return loginRequest.execute().then(function (response) {
                      return response.data;
                    });
                  }).then(function (user) {
                    user._socialIdentity[session.identity] = (0, _defaults2.default)(user._socialIdentity[session.identity], session);
                    return _local2.default.setActiveUser(_this5.client, user);
                  }).then(function () {
                    return _this5.execute(rawResponse, false);
                  })
                };
              }
            }

            throw error;
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }

        throw error;
      });
    }
  }, {
    key: 'appVersion',
    get: function get() {
      return this.client.appVersion;
    }
  }, {
    key: 'query',
    get: function get() {
      return this._query;
    },
    set: function set(query) {
      if ((0, _utils.isDefined)(query) && !(query instanceof _query2.default)) {
        throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');
      }

      this._query = query;
    }
  }, {
    key: 'aggregation',
    get: function get() {
      return this._aggregation;
    },
    set: function set(aggregation) {
      if ((0, _utils.isDefined)(aggregation) && !(aggregation instanceof _aggregation2.default)) {
        throw new _errors.KinveyError('Invalid aggregation. It must be an instance of the Aggregation class.');
      }

      if ((0, _utils.isDefined)(aggregation)) {
        this.body = aggregation.toJSON();
      }

      this._aggregation = aggregation;
    }
  }, {
    key: 'headers',
    get: function get() {
      var headers = _get(KinveyRequest.prototype.__proto__ || Object.getPrototypeOf(KinveyRequest.prototype), 'headers', this);

      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json; charset=utf-8');
      }

      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json; charset=utf-8');
      }

      if (!headers.has('X-Kinvey-Api-Version')) {
        headers.set('X-Kinvey-Api-Version', defaultApiVersion);
      }

      if (this.skipBL === true) {
        headers.set('X-Kinvey-Skip-Business-Logic', true);
      } else {
        headers.remove('X-Kinvey-Skip-Business-Logic');
      }

      if (this.trace === true) {
        headers.set('X-Kinvey-Include-Headers-In-Response', 'X-Kinvey-Request-Id');
        headers.set('X-Kinvey-ResponseWrapper', true);
      } else {
        headers.remove('X-Kinvey-Include-Headers-In-Response');
        headers.remove('X-Kinvey-ResponseWrapper');
      }

      if (this.appVersion) {
        headers.set('X-Kinvey-Client-App-Version', this.appVersion);
      } else {
        headers.remove('X-Kinvey-Client-App-Version');
      }

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

      headers.set('X-Kinvey-Device-Information', (0, _device.deviceInformation)());

      return headers;
    },
    set: function set(headers) {
      _set(KinveyRequest.prototype.__proto__ || Object.getPrototypeOf(KinveyRequest.prototype), 'headers', headers, this);
    }
  }, {
    key: 'url',
    get: function get() {
      var urlString = _get(KinveyRequest.prototype.__proto__ || Object.getPrototypeOf(KinveyRequest.prototype), 'url', this);
      var queryString = this.query ? this.query.toQueryString() : {};

      if ((0, _isEmpty2.default)(queryString)) {
        return urlString;
      }

      return (0, _appendQuery2.default)(urlString, _qs2.default.stringify(queryString));
    },
    set: function set(urlString) {
      _set(KinveyRequest.prototype.__proto__ || Object.getPrototypeOf(KinveyRequest.prototype), 'url', urlString, this);
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
  }]);

  return KinveyRequest;
}(NetworkRequest);