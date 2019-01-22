"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getId = getId;

var _utils = require("./utils");

var _config = require("./config");

// eslint-disable-next-line import/prefer-default-export
function getId() {
  var _getConfig = (0, _config.get)(),
      appKey = _getConfig.appKey;

  var key = "".concat(appKey, ".deviceId");
  var id = window.localStorage.getItem(key);

  if (!id) {
    id = (0, _utils.uuidv4)();
    window.localStorage.setItem(key, id);
  }

  return id;
}