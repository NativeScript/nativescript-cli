'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deviceInformation = deviceInformation;

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function deviceInformation() {
  var platform = process.title;
  var version = process.version;
  var manufacturer = process.platform;

  var parts = ['js-' + _package2.default.name + '/' + _package2.default.version];

  return parts.concat([platform, version, manufacturer]).map(function (part) {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}