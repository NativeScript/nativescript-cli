'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Device = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.isNode = isNode;
exports.isPhoneGap = isPhoneGap;
exports.isTitanium = isTitanium;
exports.isiOS = isiOS;
exports.isAndroid = isAndroid;
exports.isBrowser = isBrowser;

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function isNode() {
  return typeof module !== 'undefined' && !!module.exports;
}

function isPhoneGap() {
  return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
}

function isTitanium() {
  return typeof Titanium !== 'undefined';
}

function isiOS() {
  if (isNode()) {
    return false;
  } else if (isPhoneGap()) {
    return typeof global.device !== 'undefined' && global.device.platform === 'iOS';
  } else if (isTitanium()) {
    return Titanium.Platform.osname === 'iphone' || Titanium.Platform.osname === 'ipad';
  }

  return (/iPad|iPhone|iPod/.test(global.navigator.userAgent) && !window.MSStream
  );
}

function isAndroid() {
  if (isNode()) {
    return false;
  } else if (isPhoneGap()) {
    return typeof global.device !== 'undefined' && global.device.platform === 'Android';
  } else if (isTitanium()) {
    return Titanium.Platform.osname === 'android';
  }

  return (/Android/.test(global.navigator.userAgent)
  );
}

function isBrowser() {
  if (isNode()) {
    return false;
  } else if (isPhoneGap()) {
    return typeof global.device !== 'undefined' && global.device.platform === 'browser';
  } else if (isTitanium()) {
    return Titanium.Platform.name === 'mobileweb';
  }

  return !isiOS() && !isAndroid();
}

/**
 * @private
 */

var Device = exports.Device = function () {
  function Device() {
    _classCallCheck(this, Device);
  }

  _createClass(Device, null, [{
    key: 'toJSON',
    value: function toJSON() {
      if (isNode()) {
        var os = require('os');

        return {
          latform: {
            name: 'node',
            version: process.version
          },
          os: {
            name: os.platform(),
            version: os.release()
          },
          kinveySDK: {
            name: _package2.default.name,
            version: _package2.default.version
          }
        };
      } else if (isPhoneGap()) {
        if (isBrowser()) {
          var _userAgent = global.navigator.userAgent.toLowerCase();
          var _rChrome = /(chrome)\/([\w]+)/;
          var _rFirefox = /(firefox)\/([\w.]+)/;
          var _rIE = /(msie) ([\w.]+)/i;
          var _rOpera = /(opera)(?:.*version)?[ \/]([\w.]+)/;
          var _rSafari = /(safari)\/([\w.]+)/;
          var _browser = _rChrome.exec(_userAgent) || _rFirefox.exec(_userAgent) || _rIE.exec(_userAgent) || _rOpera.exec(_userAgent) || _rSafari.exec(_userAgent) || [];

          return {
            device: {
              model: global.navigator.userAgent
            },
            platform: {
              name: 'phonegap'
            },
            os: {
              name: _browser[1],
              version: _browser[2]
            },
            kinveySDK: {
              name: _package2.default.name,
              version: _package2.default.version
            }
          };
        }

        return {
          device: {
            model: global.device.model
          },
          platform: {
            name: 'phonegap',
            version: global.device.cordova
          },
          os: {
            name: global.device.platform,
            version: global.device.version
          },
          kinveySDK: {
            name: _package2.default.name,
            version: _package2.default.version
          }
        };
      } else if (isTitanium()) {
        return {
          device: {
            manufacturer: Titanium.Platform.manufacturer,
            model: Titanium.Platfrom.model
          },
          platform: {
            name: 'titanium',
            version: Titanium.getVersion()
          },
          os: {
            name: Titanium.Platfrom.osname,
            version: Titanium.Platfrom.version
          },
          kinveySDK: {
            name: _package2.default.name,
            version: _package2.default.version
          }
        };
      }

      var userAgent = global.navigator.userAgent.toLowerCase();
      var rChrome = /(chrome)\/([\w]+)/;
      var rFirefox = /(firefox)\/([\w.]+)/;
      var rIE = /(msie) ([\w.]+)/i;
      var rOpera = /(opera)(?:.*version)?[ \/]([\w.]+)/;
      var rSafari = /(safari)\/([\w.]+)/;
      var browser = rChrome.exec(userAgent) || rFirefox.exec(userAgent) || rIE.exec(userAgent) || rOpera.exec(userAgent) || rSafari.exec(userAgent) || [];

      return {
        device: {
          model: global.navigator.userAgent
        },
        platform: {
          name: 'html5'
        },
        os: {
          name: browser[1],
          version: browser[2]
        },
        kinveySDK: {
          name: _package2.default.name,
          version: _package2.default.version
        }
      };
    }
  }]);

  return Device;
}();