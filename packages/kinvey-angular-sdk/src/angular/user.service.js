"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _core = require("@angular/core");

var _exists2 = _interopRequireDefault(require("../user/exists"));

var _forgotUsername2 = _interopRequireDefault(require("../user/forgotUsername"));

var _login2 = _interopRequireDefault(require("../user/login"));

var _loginWithRedirectUri2 = _interopRequireDefault(require("../user/loginWithRedirectUri"));

var _loginWithUsernamePassword2 = _interopRequireDefault(require("../user/loginWithUsernamePassword"));

var _loginWithMIC2 = _interopRequireDefault(require("../user/loginWithMIC"));

var _logout2 = _interopRequireDefault(require("../user/logout"));

var _lookup2 = _interopRequireDefault(require("../user/lookup"));

var _me2 = _interopRequireDefault(require("../user/me"));

var _remove2 = _interopRequireDefault(require("../user/remove"));

var _resetPassword2 = _interopRequireDefault(require("../user/resetPassword"));

var _restore2 = _interopRequireDefault(require("../user/restore"));

var _signup2 = _interopRequireDefault(require("../user/signup"));

var _update2 = _interopRequireDefault(require("../user/update"));

var _getActiveUser2 = _interopRequireDefault(require("../user/getActiveUser"));

var _verifyEmail2 = _interopRequireDefault(require("../user/verifyEmail"));

/* eslint-disable class-methods-use-this */
var UserService =
/*#__PURE__*/
function () {
  function UserService() {
    (0, _classCallCheck2.default)(this, UserService);
  }

  (0, _createClass2.default)(UserService, [{
    key: "exists",
    value: function exists() {
      return _exists2.default.apply(void 0, arguments);
    }
  }, {
    key: "forgotUsername",
    value: function forgotUsername() {
      return _forgotUsername2.default.apply(void 0, arguments);
    }
  }, {
    key: "login",
    value: function login() {
      return _login2.default.apply(void 0, arguments);
    }
  }, {
    key: "loginWithRedirectUri",
    value: function loginWithRedirectUri() {
      return _loginWithRedirectUri2.default.apply(void 0, arguments);
    }
  }, {
    key: "loginWithUsernamePassword",
    value: function loginWithUsernamePassword() {
      return _loginWithUsernamePassword2.default.apply(void 0, arguments);
    }
  }, {
    key: "loginWithMIC",
    value: function loginWithMIC() {
      return _loginWithMIC2.default.apply(void 0, arguments);
    }
  }, {
    key: "logout",
    value: function logout() {
      return _logout2.default.apply(void 0, arguments);
    }
  }, {
    key: "lookup",
    value: function lookup() {
      return _lookup2.default.apply(void 0, arguments);
    }
  }, {
    key: "me",
    value: function me() {
      return _me2.default.apply(void 0, arguments);
    }
  }, {
    key: "remove",
    value: function remove() {
      return _remove2.default.apply(void 0, arguments);
    }
  }, {
    key: "resetPassword",
    value: function resetPassword() {
      return _resetPassword2.default.apply(void 0, arguments);
    }
  }, {
    key: "restore",
    value: function restore() {
      return _restore2.default.apply(void 0, arguments);
    }
  }, {
    key: "signup",
    value: function signup() {
      return _signup2.default.apply(void 0, arguments);
    }
  }, {
    key: "update",
    value: function update() {
      return _update2.default.apply(void 0, arguments);
    }
  }, {
    key: "getActiveUser",
    value: function getActiveUser() {
      return (0, _getActiveUser2.default)();
    }
  }, {
    key: "verifyEmail",
    value: function verifyEmail() {
      return _verifyEmail2.default.apply(void 0, arguments);
    }
  }]);
  return UserService;
}();

UserService.decorators = [{
  type: _core.Injectable
}];
var _default = UserService;
exports.default = _default;