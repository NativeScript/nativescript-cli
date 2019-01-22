"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _exists = _interopRequireDefault(require("./exists"));

var _forgotUsername = _interopRequireDefault(require("./forgotUsername"));

var _login = _interopRequireDefault(require("./login"));

var _loginWithRedirectUri = _interopRequireDefault(require("./loginWithRedirectUri"));

var _loginWithUsernamePassword = _interopRequireDefault(require("./loginWithUsernamePassword"));

var _loginWithMIC = _interopRequireDefault(require("./loginWithMIC"));

var _logout = _interopRequireDefault(require("./logout"));

var _lookup = _interopRequireDefault(require("./lookup"));

var _me = _interopRequireDefault(require("./me"));

var _remove = _interopRequireDefault(require("./remove"));

var _resetPassword = _interopRequireDefault(require("./resetPassword"));

var _restore = _interopRequireDefault(require("./restore"));

var _signup = _interopRequireDefault(require("./signup"));

var _update = _interopRequireDefault(require("./update"));

var _getActiveUser = _interopRequireDefault(require("./getActiveUser"));

var _user = _interopRequireDefault(require("./user"));

var _verifyEmail = _interopRequireDefault(require("./verifyEmail"));

_user.default.exists = _exists.default;
_user.default.forgotUsername = _forgotUsername.default;
_user.default.login = _login.default;
_user.default.loginWithRedirectUri = _loginWithRedirectUri.default;
_user.default.loginWithUsernamePassword = _loginWithUsernamePassword.default;
_user.default.loginWithMIC = _loginWithMIC.default;
_user.default.logout = _logout.default;
_user.default.lookup = _lookup.default;
_user.default.me = _me.default;
_user.default.remove = _remove.default;
_user.default.resetPassword = _resetPassword.default;
_user.default.restore = _restore.default;
_user.default.signup = _signup.default;
_user.default.update = _update.default;
_user.default.verifyEmail = _verifyEmail.default;
_user.default.getActiveUser = _getActiveUser.default;
var _default = _user.default;
exports.default = _default;