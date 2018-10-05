"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.serialize = serialize;
exports.parse = parse;

require("core-js/modules/web.dom.iterable");

var _isString = _interopRequireDefault(require("lodash/isString"));

function serialize(contentType, body) {
  if (!(0, _isString.default)(body)) {
    if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
      const str = [];
      Object.keys(body).forEach(key => {
        str.push(`${global.encodeURIComponent(key)}=${global.encodeURIComponent(body[key])}`);
      });
      return str.join('&');
    } else if (contentType.indexOf('application/json') === 0) {
      return JSON.stringify(body);
    }
  }

  return body;
}

function parse(contentType = 'application/json', data) {
  if ((0, _isString.default)(data)) {
    if (contentType.indexOf('application/json') === 0) {
      try {
        return JSON.parse(data);
      } catch (error) {// TODO: log error
      }
    }
  }

  return data;
}