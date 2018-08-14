'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RequestMethod = undefined;

var _headers = require('./headers');

var _headers2 = _interopRequireDefault(_headers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @private
 */
var RequestMethod = exports.RequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

/**
 * @private
 */

var Request = function Request(request) {
  _classCallCheck(this, Request);

  this.headers = new _headers2.default(request.headers);
  this.method = request.method;
  this.url = request.url;
  this.body = request.body;
  this.timeout = request.timeout;
};

exports.default = Request;