"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatKinveyUrl = formatKinveyUrl;
exports.serialize = serialize;
exports.parse = parse;

var _url = require("url");

var _isString = _interopRequireDefault(require("lodash/isString"));

var _isPlainObject = _interopRequireDefault(require("lodash/isPlainObject"));

function clean(value) {
  if ((0, _isPlainObject.default)(value)) {
    return Object.keys(value).reduce(function (cleanVal, key) {
      var objVal = value[key];

      if ((0, _isPlainObject.default)(objVal)) {
        objVal = clean(objVal);
      }

      if (typeof objVal !== 'undefined' && objVal !== null) {
        cleanVal[key] = objVal;
      }

      return cleanVal;
    }, {});
  }

  return value;
}

function formatKinveyUrl(protocol, host, pathname, query) {
  var cleanQuery = clean(query);
  return (0, _url.format)({
    protocol: protocol,
    host: host,
    pathname: pathname,
    query: cleanQuery
  });
}

function serialize(contentType, body) {
  if (body && !(0, _isString.default)(body)) {
    if (contentType.indexOf('application/x-www-form-urlencoded') === 0) {
      var str = [];
      Object.keys(body).forEach(function (key) {
        str.push("".concat(global.encodeURIComponent(key), "=").concat(global.encodeURIComponent(body[key])));
      });
      return str.join('&');
    } else if (contentType.indexOf('application/json') === 0) {
      return JSON.stringify(body);
    }
  }

  return body;
}

function parse() {
  var contentType = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'application/json';
  var data = arguments.length > 1 ? arguments[1] : undefined;

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