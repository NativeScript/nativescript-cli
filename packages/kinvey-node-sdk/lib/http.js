'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = http;

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function http(request) {
  return new Promise(function (resolve, reject) {
    (0, _request2.default)({
      headers: request.headers,
      method: request.method,
      url: request.url,
      body: request.body
    }, function (error, httpResponse, data) {
      if (error) {
        reject(error);
      } else {
        resolve({ statusCode: httpResponse.statusCode, headers: httpResponse.headers, data: data });
      }
    });
  });
}