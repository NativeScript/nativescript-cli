'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KinveyMiddleware = exports.Middleware = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _asciiTree = require('./asciiTree');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @private
 */

var Middleware = exports.Middleware = function () {
  function Middleware() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Middleware' : arguments[0];

    _classCallCheck(this, Middleware);

    this.name = name;
  }

  _createClass(Middleware, [{
    key: 'handle',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(request) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (request) {
                  _context.next = 2;
                  break;
                }

                throw new Error('Request is null. Please provide a valid request.');

              case 2:
                return _context.abrupt('return', request);

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function handle(_x2) {
        return ref.apply(this, arguments);
      }

      return handle;
    }()
  }, {
    key: 'generateTree',
    value: function generateTree() {
      var level = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

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
      return _asciiTree.AsciiTree.generate(root);
    }
  }]);

  return Middleware;
}();

/**
 * @private
 */


var KinveyMiddleware = exports.KinveyMiddleware = function (_Middleware) {
  _inherits(KinveyMiddleware, _Middleware);

  function KinveyMiddleware() {
    var name = arguments.length <= 0 || arguments[0] === undefined ? 'Kinvey Middleware' : arguments[0];

    _classCallCheck(this, KinveyMiddleware);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(KinveyMiddleware).call(this, name));
  }

  _createClass(KinveyMiddleware, [{
    key: 'handle',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(request) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', _get(Object.getPrototypeOf(KinveyMiddleware.prototype), 'handle', this).call(this, request));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function handle(_x5) {
        return ref.apply(this, arguments);
      }

      return handle;
    }()
  }]);

  return KinveyMiddleware;
}(Middleware);