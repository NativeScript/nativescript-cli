'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _AbstractDocJs = require('./AbstractDoc.js');

var _AbstractDocJs2 = _interopRequireDefault(_AbstractDocJs);

var _ParserParamParserJs = require('../Parser/ParamParser.js');

var _ParserParamParserJs2 = _interopRequireDefault(_ParserParamParserJs);

var _UtilASTUtilJs = require('../Util/ASTUtil.js');

var _UtilASTUtilJs2 = _interopRequireDefault(_UtilASTUtilJs);

/**
 * Doc Class from Variable Declaration AST node.
 */

var VariableDoc = (function (_AbstractDoc) {
  _inherits(VariableDoc, _AbstractDoc);

  function VariableDoc() {
    _classCallCheck(this, VariableDoc);

    _get(Object.getPrototypeOf(VariableDoc.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(VariableDoc, [{
    key: '@_kind',

    /** specify ``variable`` to kind. */
    value: function _kind() {
      _get(Object.getPrototypeOf(VariableDoc.prototype), '@_kind', this).call(this);
      if (this._value.kind) return;

      this._value.kind = 'variable';
    }

    /** set name by using self node. */
  }, {
    key: '@_name',
    value: function _name() {
      _get(Object.getPrototypeOf(VariableDoc.prototype), '@_name', this).call(this);
      if (this._value.name) return;

      switch (this._node.declarations[0].id.type) {
        case 'Identifier':
          this._value.name = this._node.declarations[0].id.name;
          break;
        case 'ObjectPattern':
          // TODO: optimize
          this._value.name = this._node.declarations[0].id.properties[0].key.name;
          break;
        case 'ArrayPattern':
          // TODO: optimize
          this._value.name = this._node.declarations[0].id.elements[0].name;
          break;
      }
    }

    /** set memberof by using file path. */
  }, {
    key: '@_memberof',
    value: function _memberof() {
      _get(Object.getPrototypeOf(VariableDoc.prototype), '@_memberof', this).call(this);
      if (this._value.memberof) return;
      this._value.memberof = this._pathResolver.filePath;
    }

    /** if @type is not exists, guess type by using self node. */
  }, {
    key: '@type',
    value: function type() {
      _get(Object.getPrototypeOf(VariableDoc.prototype), '@type', this).call(this);
      if (this._value.type) return;

      if (this._node.declarations[0].init.type === 'NewExpression') {
        var className = this._node.declarations[0].init.callee.name;
        var longname = this._findClassLongname(className);
        if (!longname) longname = '*';
        this._value.type = { types: [longname] };
      } else {
        this._value.type = _ParserParamParserJs2['default'].guessType(this._node.declarations[0].init);
      }
    }
  }]);

  return VariableDoc;
})(_AbstractDocJs2['default']);

exports['default'] = VariableDoc;
module.exports = exports['default'];