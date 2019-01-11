"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _exists = _interopRequireDefault(require("./exists"));

var _forgotUsername = _interopRequireDefault(require("./forgotUsername"));

var _login = require("./login");

var _logout = _interopRequireDefault(require("./logout"));

var _lookup = _interopRequireDefault(require("./lookup"));

var _me = _interopRequireDefault(require("./me"));

var _remove = _interopRequireDefault(require("./remove"));

var _resetPassword = _interopRequireDefault(require("./resetPassword"));

var _restore = _interopRequireDefault(require("./restore"));

var _signup = require("./signup");

var _update = _interopRequireDefault(require("./update"));

var _user = require("./user");

var _verifyEmail = _interopRequireDefault(require("./verifyEmail"));

_user.User.exists = _exists.default;
_user.User.forgotUsername = _forgotUsername.default;
_user.User.login = _login.login;
_user.User.loginWithRedirectUri = _login.loginWithRedirectUri;
_user.User.loginWithUsernamePassword = _login.loginWithUsernamePassword;
_user.User.loginWithMIC = _login.loginWithMIC;
_user.User.logout = _logout.default;
_user.User.lookup = _lookup.default;
_user.User.me = _me.default;
_user.User.remove = _remove.default;
_user.User.resetPassword = _resetPassword.default;
_user.User.restore = _restore.default;
_user.User.signup = _signup.signup;
_user.User.update = _update.default;
_user.User.verifyEmail = _verifyEmail.default;
_user.User.getActiveUser = _user.getActiveUser;
var _default = _user.User;
exports.default = _default;