"use strict";

require("core-js/modules/es.symbol");

require("core-js/modules/es.symbol.description");

require("core-js/modules/es.symbol.iterator");

require("core-js/modules/es.array.concat");

require("core-js/modules/es.array.find");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.date.to-string");

require("core-js/modules/es.function.name");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.string.iterator");

require("core-js/modules/web.dom-collections.iterator");

require("core-js/modules/web.timers");

var _chai = require("chai");

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var _this = void 0;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// the same redirect url should be configured on the server
var serverHost = 'auth.kinvey.com';
var redirectUrl = 'http://localhost:9876/callback';
var authServiceId = process.env.AUTH_SERVICE_ID;
var noRefreshAuthServiceId = process.env.NO_REFRESH_AUTH_SERVICE_ID;
var wrongSetupAuthServiceId = process.env.WRONG_AUTH_SERVICE_ID;
var micDefaultVersion = 'v3'; // the used OAuth 2 provider is Facebook

var fbEmail = process.env.FACEBOOK_EMAIL;
var fbPassword = process.env.FACEBOOK_PASSWORD;
var fbDevUrl = 'https://developers.facebook.com';
var fbUserName = 'Test User Facebook';
var fbCookieName = 'c_user';
var fbCookieValue = '1172498488';
var collectionName = process.env.COLLECTION_NAME;
var networkstore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network); // The configured access_token ttl is 3 seconds on the server for the default auth service

var defaultServiceAccessTokenTTL = 3000; // Currently the server returns refresh_token = 'null' if the auth service does not allow refresh tokens.
// The tests should be changed when this is fixed on the server

var notAllowedRefreshTokenValue = 'null';
var invalidUrl = 'invalid_url';
var shouldNotBeInvokedMessage = 'Should not happen';
var cancelledLoginMessage = 'Login has been cancelled.';
var winOpen;
var actualHref;

var getExpectedInitialUrl = function getExpectedInitialUrl(appKey, micVersion, redirectUrl) {
  return "https://".concat(serverHost, "/").concat(micVersion, "/oauth/auth?client_id=").concat(appKey, "&redirect_uri=").concat(redirectUrl, "&response_type=code&scope=openid");
};

var validateSuccessfulDataRead = function validateSuccessfulDataRead(done) {
  return networkstore.find().toPromise().then(function (result) {
    (0, _chai.expect)(result).to.be.an('array');
    done();
  });
};

var expireFBCookie = function expireFBCookie(fbWindow, cookieName, cookieValue, expiredDays) {
  var newDate = new Date();
  newDate.setTime(newDate.getTime() - expiredDays * 24 * 60 * 60 * 1000);
  var expires = "expires=".concat(newDate.toUTCString());
  var domain = 'domain=.facebook.com';
  var newValue = "".concat(cookieName, "=").concat(cookieValue, ";").concat(expires, ";").concat(domain, ";path=/");
  fbWindow.document.cookie = newValue;
};

var validateMICUser = function validateMICUser(user, allowRefreshTokens, explicitAuthServiceId) {
  (0, _chai.expect)(user).to.deep.equal(Kinvey.User.getActiveUser());
  var userData = user.data;
  var kinveyAuth = userData._socialIdentity.kinveyAuth;
  var metadata = userData._kmd;
  (0, _chai.expect)(userData._id).to.exist;
  (0, _chai.expect)(userData.username).to.exist;
  (0, _chai.expect)(userData._acl.creator).to.exist;
  (0, _chai.expect)(metadata.lmt).to.exist;
  (0, _chai.expect)(metadata.ect).to.exist;
  (0, _chai.expect)(metadata.authtoken).to.exist;
  (0, _chai.expect)(kinveyAuth.id).to.exist;
  (0, _chai.expect)(kinveyAuth.name).to.equal(fbUserName);
  (0, _chai.expect)(kinveyAuth.access_token).to.exist;

  if (allowRefreshTokens) {
    (0, _chai.expect)(_typeof(kinveyAuth.refresh_token)).to.equal('string');
    (0, _chai.expect)(kinveyAuth.refresh_token).to.not.equal(notAllowedRefreshTokenValue);
  } else {
    (0, _chai.expect)(kinveyAuth.refresh_token).to.equal(notAllowedRefreshTokenValue);
  }

  (0, _chai.expect)(kinveyAuth.token_type).to.equal('Bearer');
  (0, _chai.expect)(_typeof(kinveyAuth.expires_in)).to.equal('number');
  (0, _chai.expect)(kinveyAuth.id_token).to.exist;
  (0, _chai.expect)(kinveyAuth.identity).to.equal('kinveyAuth');

  if (explicitAuthServiceId) {
    if (allowRefreshTokens) {
      (0, _chai.expect)(kinveyAuth.client_id).to.equal("".concat(process.env.APP_KEY, ".").concat(authServiceId));
    } else {
      (0, _chai.expect)(kinveyAuth.client_id).to.equal("".concat(process.env.APP_KEY, ".").concat(noRefreshAuthServiceId));
    }
  } else {
    (0, _chai.expect)(kinveyAuth.client_id).to.equal(process.env.APP_KEY);
  }

  (0, _chai.expect)(kinveyAuth.redirect_uri).to.equal(redirectUrl);
  (0, _chai.expect)(kinveyAuth.protocol).to.equal('https:');
  (0, _chai.expect)(kinveyAuth.host).to.equal(serverHost);
};

var addLoginFacebookHandler = function addLoginFacebookHandler() {
  // monkey patch window.open - the function is reset back in the afterEach hook
  window.open = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var fbPopup = winOpen.apply(_this, args);
    fbPopup.addEventListener('load', function () {
      var setIntervalVar = setInterval(function () {
        if (fbPopup.closed) {
          clearInterval(setIntervalVar);
        } else {
          var email = fbPopup.document.getElementById('email');
          var pass = fbPopup.document.getElementById('pass');
          var loginButton = fbPopup.document.getElementById('loginbutton');

          if (email && pass && loginButton) {
            email.value = fbEmail;
            pass.value = fbPassword;
            loginButton.click();
            clearInterval(setIntervalVar);
          }
        }
      }, 1000);
    });
    return fbPopup;
  };
};

var addCloseFacebookPopupHandler = function addCloseFacebookPopupHandler(retrievePopupUrl) {
  window.open = function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var fbPopup = winOpen.apply(_this, args);
    fbPopup.addEventListener('load', function () {
      if (retrievePopupUrl) {
        actualHref = fbPopup.location.href;
      }

      fbPopup.close();
    });
    return fbPopup;
  };
};

var resolveAfter = function resolveAfter(timeInMs) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve();
    }, timeInMs);
  });
};

describe('MIC Integration', function () {
  before(function () {
    return Kinvey.init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });
  beforeEach(function (done) {
    Kinvey.User.logout().then(function () {
      var fbWindow = window.open(fbDevUrl);
      fbWindow.addEventListener('load', function () {
        expireFBCookie(fbWindow, fbCookieName, fbCookieValue, 3);
        fbWindow.close();
        winOpen = window.open;
        actualHref = null;
        done();
      }, true);
    });
  });
  afterEach(function (done) {
    window.open = winOpen;
    done();
  });
  it('should login the user, using the default Auth service, which allows refresh tokens', function (done) {
    addLoginFacebookHandler();
    Kinvey.User.loginWithRedirectUri(redirectUrl).then(function (user) {
      validateMICUser(user, true);
      return Kinvey.User.exists(user.username);
    }).then(function (existsOnServer) {
      (0, _chai.expect)(existsOnServer).to.be["true"];
      return validateSuccessfulDataRead(done);
    })["catch"](done);
  });
  it('should login the user, using loginWithMIC()', function (done) {
    addLoginFacebookHandler();
    Kinvey.User.loginWithMIC(redirectUrl).then(function (user) {
      validateMICUser(user, true);
      return Kinvey.User.exists(user.username);
    }).then(function (existsOnServer) {
      (0, _chai.expect)(existsOnServer).to.be["true"];
      return validateSuccessfulDataRead(done);
    })["catch"](done);
  });
  it('should login the user, using the specified Auth service, which does not allow refresh tokens', function (done) {
    addLoginFacebookHandler();
    Kinvey.User.loginWithRedirectUri(redirectUrl, {
      micId: noRefreshAuthServiceId
    }).then(function (user) {
      validateMICUser(user, false, true);
      return validateSuccessfulDataRead(done);
    })["catch"](done);
  });
  it('should refresh an expired access_token and not logout the user', function (done) {
    addLoginFacebookHandler();
    Kinvey.User.loginWithRedirectUri(redirectUrl).then(function (user) {
      (0, _chai.expect)(user).to.exist; // the test waits for the expiration of the access_token

      return resolveAfter(defaultServiceAccessTokenTTL + 100);
    }).then(function () {
      return validateSuccessfulDataRead(done);
    })["catch"](done);
  });
  it("should make a correct request to KAS with the default ".concat(micDefaultVersion, " version"), function (done) {
    // Currently the error function is not called when the redirect url is invalid,
    // so the test is closing the popup in order to resume execution and validate the request url
    addCloseFacebookPopupHandler(true);
    Kinvey.User.loginWithRedirectUri(invalidUrl).then(function () {
      return done(new Error(shouldNotBeInvokedMessage));
    })["catch"](function () {
      (0, _chai.expect)(actualHref).to.equal(getExpectedInitialUrl(process.env.APP_KEY, micDefaultVersion, invalidUrl));
      done();
    })["catch"](done);
  });
  it('should make a correct request to KAS with the supplied options.version', function (done) {
    // Currently the error function is not called when the redirect url is invalid,
    // so the test is closing the popup in order to resume execution and validate the request url
    var submittedVersion = 'v2';
    addCloseFacebookPopupHandler(true);
    Kinvey.User.loginWithRedirectUri(invalidUrl, {
      version: submittedVersion
    }).then(function () {
      return done(new Error(shouldNotBeInvokedMessage));
    })["catch"](function () {
      (0, _chai.expect)(actualHref).to.equal(getExpectedInitialUrl(process.env.APP_KEY, submittedVersion, invalidUrl));
      done();
    })["catch"](done);
  });
  it('should throw an error if the user cancels the login', function (done) {
    addCloseFacebookPopupHandler();
    Kinvey.User.loginWithRedirectUri(redirectUrl).then(function () {
      return done(new Error(shouldNotBeInvokedMessage));
    })["catch"](function (err) {
      (0, _chai.expect)(err.message).to.equal(cancelledLoginMessage);
      done();
    })["catch"](done);
  });
  it('should throw an error if an active user already exists', function (done) {
    addLoginFacebookHandler();
    Kinvey.User.signup().then(function () {
      return Kinvey.User.loginWithRedirectUri(redirectUrl);
    }).then(function () {
      return done(new Error(shouldNotBeInvokedMessage));
    })["catch"](function (err) {
      (0, _chai.expect)(err.message).to.contain('An active user already exists.');
      done();
    })["catch"](done);
  });
  it('should return the error from the Oauth provider with the default MIC version', function (done) {
    addLoginFacebookHandler();
    Kinvey.User.loginWithRedirectUri(redirectUrl, {
      micId: wrongSetupAuthServiceId
    }).then(function () {
      return done(new Error(shouldNotBeInvokedMessage));
    })["catch"](function (err) {
      (0, _chai.expect)(err.name).to.equal('KinveyError');
      (0, _chai.expect)(err.message).to.equal('server_error');
      (0, _chai.expect)(err.debug).to.contain('OAuth provider returned an error when trying to retrieve the token');
      done();
    })["catch"](done);
  });
});