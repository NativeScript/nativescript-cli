'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
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

  for (var i = 1; i < node.level; i++) {
    ret = '' + ret + (levels[i] ? ' ' : c3);
    ret = ret + '  ';
  }

  return '' + ret + c + c1 + ' ' + node.value;
}

/**
 * @private
 */
var AsciiTree = exports.AsciiTree = {
  generate: function generate() {
    var _this = this;

    var tree = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var end = arguments[1];

    var result = compose(tree, end);

    if (tree.nodes.length > 0) {
      (function () {
        var last = tree.nodes.length - 1;
        tree.nodes.forEach(function (subTree, index) {
          levels[subTree.level] = index === last;
          result = result + _this.generate(subTree, index === last);
        });
      })();
    }

    return result;
  }
};