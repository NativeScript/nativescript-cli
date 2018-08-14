'use strict';

require('babel-polyfill');

var _kinveyJsSdk = require('kinvey-js-sdk');

var _kinveyJsSdk2 = _interopRequireDefault(_kinveyJsSdk);

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = (0, _kinveyJsSdk2.default)(_http2.default);