'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var levels = [];
var c0 = String.fromCharCode(9500);
var c1 = String.fromCharCode(9472);
var c2 = String.fromCharCode(9492);
var c3 = String.fromCharCode(9474);

function compose(node, end) {
  if (node.level === 0) {
    return node.value;
  }

  var ret = '\r\n';
  var c = end ? c2 : c0;

  for (var i = 1; i < node.level; i += 1) {
    ret = '' + ret + (levels[i] ? ' ' : c3);
    ret = ret + '  ';
  }

  return '' + ret + c + c1 + ' ' + node.value;
}

var AsciiTree = function () {
  function AsciiTree() {
    _classCallCheck(this, AsciiTree);
  }

  _createClass(AsciiTree, null, [{
    key: 'generate',
    value: function generate() {
      var _this = this;

      var tree = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var end = arguments[1];

      var result = compose(tree, end);

      if (tree.nodes.length > 0) {
        (function () {
          var last = tree.nodes.length - 1;
          tree.nodes.forEach(function (subTree, index) {
            levels[subTree.level] = index === last;
            result += _this.generate(subTree, index === last);
          });
        })();
      }

      return result;
    }
  }]);

  return AsciiTree;
}();

exports.default = AsciiTree;