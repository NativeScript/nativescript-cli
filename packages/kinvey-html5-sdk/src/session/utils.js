"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getKey = getKey;

var _config = require("../kinvey/config");

// eslint-disable-next-line import/prefer-default-export
function getKey() {
  var _getConfig = (0, _config.get)(),
      appKey = _getConfig.appKey;

  return "".concat(appKey, ".active_user");
}