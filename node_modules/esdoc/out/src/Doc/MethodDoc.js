'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _escodegen = require('escodegen');

var _escodegen2 = _interopRequireDefault(_escodegen);

var _AbstractDocJs = require('./AbstractDoc.js');

var _AbstractDocJs2 = _interopRequireDefault(_AbstractDocJs);

var _ParserParamParserJs = require('../Parser/ParamParser.js');

var _ParserParamParserJs2 = _interopRequireDefault(_ParserParamParserJs);

/**
 * Doc Class from Method Definition AST node.
 */

var MethodDoc = (function (_AbstractDoc) {
  _inherits(MethodDoc, _AbstractDoc);

  function MethodDoc() {
    _classCallCheck(this, MethodDoc);

    _get(Object.getPrototypeOf(MethodDoc.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MethodDoc, [{
    key: '_apply',

    /**
     * apply own tag.
     * @private
     */
    value: function _apply() {
      _get(Object.getPrototypeOf(MethodDoc.prototype), '_apply', this).call(this);

      delete this._value['export'];
      delete this._value.importPath;
      delete this._value.importStyle;
    }

    /** use kind property of self node. */
  }, {
    key: '@_kind',
    value: function _kind() {
      _AbstractDocJs2['default'].prototype['@_kind'].call(this);
      if (this._value.kind) return;
      this._value.kind = this._node.kind;
    }

    /** take out self name from self node */
  }, {
    key: '@_name',
    value: function _name() {
      _AbstractDocJs2['default'].prototype['@_name'].call(this);
      if (this._value.name) return;

      // todo: espree parses ``*[foo.bar](){}`` as not computed.
      // so, I hacked ``!this._node.key.name`` condition.
      // this condition is not needed with acorn.
      // see https://github.com/esdoc/esdoc/issues/107
      if (this._node.computed || !this._node.key.name) {
        var expression = _escodegen2['default'].generate(this._node.key);
        this._value.name = '[' + expression + ']';
      } else {
        this._value.name = this._node.key.name;
      }
    }

    /** take out memberof from parent class node */
  }, {
    key: '@_memberof',
    value: function _memberof() {
      _AbstractDocJs2['default'].prototype['@_memberof'].call(this);
      if (this._value.memberof) return;

      var memberof = undefined;
      var parent = this._node.parent;
      while (parent) {
        if (parent.type === 'ClassDeclaration' || parent.type === 'ClassExpression') {
          memberof = this._pathResolver.filePath + '~' + parent.doc.value.name;
          this._value.memberof = memberof;
          return;
        }
        parent = parent.parent;
      }
    }

    /** if @param is not exists, guess type of param by using self node. but ``get`` and ``set`` are not guessed. */
  }, {
    key: '@param',
    value: function param() {
      _get(Object.getPrototypeOf(MethodDoc.prototype), '@param', this).call(this);
      if (this._value.params) return;

      if (['set', 'get'].includes(this._value.kind)) return;

      this._value.params = _ParserParamParserJs2['default'].guessParams(this._node.value.params);
    }

    /** if @type is not exists, guess type by using self node. only ``get`` and ``set`` are guess. */
  }, {
    key: '@type',
    value: function type() {
      _get(Object.getPrototypeOf(MethodDoc.prototype), '@type', this).call(this);
      if (this._value.type) return;

      switch (this._value.kind) {
        case 'set':
          this._value.type = _ParserParamParserJs2['default'].guessType(this._node.right);
          break;
        case 'get':
          var result = _ParserParamParserJs2['default'].guessReturnParam(this._node.value.body);
          if (result) this._value.type = result;
          break;
      }
    }

    /** if @return is not exists, guess type of return by usigin self node. but ``constructor``, ``get`` and ``set``are not guessed. */
  }, {
    key: '@return',
    value: function _return() {
      _get(Object.getPrototypeOf(MethodDoc.prototype), '@return', this).call(this);
      if (this._value['return']) return;

      if (['constructor', 'set', 'get'].includes(this._value.kind)) return;

      var result = _ParserParamParserJs2['default'].guessReturnParam(this._node.value.body);
      if (result) {
        this._value['return'] = result;
      }
    }

    /** use generator property of self node. */
  }, {
    key: '@_generator',
    value: function _generator() {
      _get(Object.getPrototypeOf(MethodDoc.prototype), '@_generator', this).call(this);
      if ('generator' in this._value) return;

      this._value.generator = this._node.value.generator;
    }
  }]);

  return MethodDoc;
})(_AbstractDocJs2['default']);

exports['default'] = MethodDoc;
module.exports = exports['default'];