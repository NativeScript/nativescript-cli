"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = http;

var _request = _interopRequireDefault(require("request"));

function http(request) {
  return new Promise(function (resolve, reject) {
    (0, _request.default)({
      headers: request.headers,
      method: request.method,
      url: request.url,
      body: request.body,
      timeout: request.timeout
    }, function (error, httpResponse, data) {
      if (error) {
        reject(error);
      } else {
        resolve({
          statusCode: httpResponse.statusCode,
          headers: httpResponse.headers,
          data: data
        });
      }
    });
  });
}