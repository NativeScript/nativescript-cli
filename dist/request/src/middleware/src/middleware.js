'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _asciitree = require('./asciitree');

var _asciitree2 = _interopRequireDefault(_asciitree);

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Middleware = function () {
  function Middleware() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Middleware';

    _classCallCheck(this, Middleware);

    this.name = name;
  }

  _createClass(Middleware, [{
    key: 'handle',
    value: function handle() {
      return _es6Promise2.default.reject(new Error('A subclass middleware must override the handle function.'));
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      return _es6Promise2.default.resolve();
    }
  }, {
    key: 'generateTree',
    value: function generateTree() {
      var level = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      var root = {
        value: this.name,
        level: level,
        nodes: []
      };
      return root;
    }
  }, {
    key: 'toString',
    value: function toString() {
      var root = this.generateTree();
      return _asciitree2.default.generate(root);
    }
  }]);

  return Middleware;
}();

exports.default = Middleware;