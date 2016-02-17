'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @private
 */

var Device = function () {
  function Device() {
    _classCallCheck(this, Device);
  }

  _createClass(Device, [{
    key: 'isCordova',
    value: function isCordova() {
      try {
        return typeof global.cordova !== 'undefined' && typeof global.device !== 'undefined';
      } catch (err) {
        // Catch any errors
      }

      return false;
    }
  }, {
    key: 'isHTML',
    value: function isHTML() {
      try {
        return typeof window !== 'undefined';
      } catch (err) {
        // Catch any errors
      }

      return false;
    }
  }, {
    key: 'isNode',
    value: function isNode() {
      try {
        return Object.prototype.toString.call(global.process) === '[object process]';
      } catch (err) {
        // Catch any errors
      }

      return false;
    }
  }, {
    key: 'isPhoneGap',
    value: function isPhoneGap() {
      return this.isCordova();
    }
  }, {
    key: 'isTitanium',
    value: function isTitanium() {
      return typeof global.Titanium !== 'undefined';
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return {
        os: this.os,
        platform: this.platform,
        library: this.library
      };
    }
  }, {
    key: 'os',
    get: function get() {
      var name = 'mobileweb';
      var version = undefined;

      if (this.isCordova()) {
        name = global.device.platform;
        version = global.device.version;
      } else if (this.isTitanium()) {
        var platform = global.Titanium.Platform;
        name = platform.getName() === 'iPhone OS' ? 'ios' : platform.getName();
        version = platform.getVersion();
      }

      return {
        name: name.toLowerCase(),
        version: version
      };
    }
  }, {
    key: 'platform',
    get: function get() {
      var name = undefined;
      var version = undefined;

      if (this.isCordova()) {
        name = 'cordova';
        version = global.device.cordova;
      } else if (this.isHTML()) {
        var userAgent = global.navigator.userAgent.toLowerCase();
        var rChrome = /(chrome)\/([\w]+)/;
        var rFirefox = /(firefox)\/([\w.]+)/;
        var rIE = /(msie) ([\w.]+)/i;
        var rOpera = /(opera)(?:.*version)?[ \/]([\w.]+)/;
        var rSafari = /(safari)\/([\w.]+)/;
        var browser = rChrome.exec(userAgent) || rFirefox.exec(userAgent) || rIE.exec(userAgent) || rOpera.exec(userAgent) || rSafari.exec(userAgent) || [];
        name = browser[1];
        version = browser[2];
      } else if (this.isNode()) {
        name = global.process.title;
        version = global.process.version;
      } else if (this.isTitanium()) {
        name = 'titanium';
        version = global.Titanium.getVersion();
      }

      return {
        name: name.toLowerCase(),
        version: version
      };
    }
  }, {
    key: 'library',
    get: function get() {
      return {
        build: process.env.KINVEY_PLATFORM_ENV || 'html5',
        version: _package2.default.version
      };
    }
  }]);

  return Device;
}();

exports.default = Device;