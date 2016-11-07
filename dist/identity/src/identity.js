'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _client = require('../../client');

var _errors = require('../../errors');

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _localStorage = require('local-storage');

var _localStorage2 = _interopRequireDefault(_localStorage);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var hello = void 0;

if (typeof window !== 'undefined') {
  hello = require('hellojs');
}

var Identity = function () {
  function Identity() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Identity);

    this.client = options.client || _client.Client.sharedInstance();
  }

  _createClass(Identity, [{
    key: 'isSupported',
    value: function isSupported() {
      return !!hello;
    }
  }, {
    key: 'isOnline',
    value: function isOnline(session) {
      var currentTime = new Date().getTime() / 1000;
      return session && session.access_token && session.expires > currentTime;
    }
  }, {
    key: 'login',
    value: function login(clientId) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options = (0, _assign2.default)({
        redirectUri: global.location.href,
        scope: null,
        force: null
      }, options);

      if (!this.isSupported()) {
        return _es6Promise2.default.reject(new _errors.KinveyError('Unable to login with ' + this.identity + '. It is not supported on this platform.'));
      }

      var session = this.session;
      if (session && this.isOnline(session)) {
        return _es6Promise2.default.resolve(session);
      }

      if (!clientId) {
        return _es6Promise2.default.reject(new _errors.KinveyError('Unable to login with ' + this.identity + '. No client id was provided.'));
      }

      var helloSettings = {};
      helloSettings[this.identity] = clientId;
      hello.init(helloSettings);
      return hello(this.identity).login({
        redirect_uri: options.redirectUri,
        scope: options.scope,
        force: options.force
      }).then(function () {
        session = hello(_this.identity).getAuthResponse();
        session.clientId = clientId;
        _this.session = session;
        return session;
      });
    }
  }, {
    key: 'logout',
    value: function logout() {
      var _this2 = this;

      var promise = _es6Promise2.default.resolve();

      if (this.isSupported()) {
        var helloSettings = {};
        helloSettings[this.identity] = this.session.clientId;
        hello.init(helloSettings);
        promise = hello(this.identity).logout();
      }

      return promise.then(function () {
        _this2.session = null;
      });
    }
  }, {
    key: 'identity',
    get: function get() {
      throw new _errors.KinveyError('A subclass must override this property.');
    }
  }, {
    key: 'session',
    get: function get() {
      return _localStorage2.default.get('' + this.client.appKey + this.identity);
    },
    set: function set(session) {
      if (session) {
        _localStorage2.default.set('' + this.client.appKey + this.identity, session);
      } else {
        _localStorage2.default.remove('' + this.client.appKey + this.identity);
      }
    }
  }], [{
    key: 'login',
    value: function login(clientId, options) {
      var social = new this(options);
      return social.login(clientId, options);
    }
  }, {
    key: 'logout',
    value: function logout(user, options) {
      var social = new this();
      return social.logout(user, options);
    }
  }, {
    key: 'identity',
    get: function get() {
      throw new _errors.KinveyError('A subclass must override this property.');
    }
  }]);

  return Identity;
}();

exports.default = Identity;