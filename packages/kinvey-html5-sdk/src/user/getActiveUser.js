"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getActiveUser;

var _session = require("../session");

var _user = _interopRequireDefault(require("./user"));

function getActiveUser() {
  var session = (0, _session.get)();

  if (session) {
    return new _user.default(session);
  }

  return null;
}