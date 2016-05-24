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

var _MethodDocJs = require('./MethodDoc.js');

var _MethodDocJs2 = _interopRequireDefault(_MethodDocJs);

var _ParserParamParserJs = require('../Parser/ParamParser.js');

var _ParserParamParserJs2 = _interopRequireDefault(_ParserParamParserJs);

/**
 * Doc Class from Member Expression AST node.
 */

var MemberDoc = (function (_AbstractDoc) {
  _inherits(MemberDoc, _AbstractDoc);

  function MemberDoc() {
    _classCallCheck(this, MemberDoc);

    _get(Object.getPrototypeOf(MemberDoc.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(MemberDoc, [{
    key: '_apply',

    /**
     * apply own tag.
     * @private
     */
    value: function _apply() {
      _get(Object.getPrototypeOf(MemberDoc.prototype), '_apply', this).call(this);

      delete this._value['export'];
      delete this._value.importPath;
      delete this._value.importStyle;
    }

    /** specify ``member`` to kind. */
  }, {
    key: '@_kind',
    value: function _kind() {
      _get(Object.getPrototypeOf(MemberDoc.prototype), '@_kind', this).call(this);
      if (this._value.kind) return;
      this._value.kind = 'member';
    }

    /** use static property in class */
  }, {
    key: '@_static',
    value: function _static() {
      var tag = this._find(['@_static']);
      if (tag) {
        var value = ['', 'true', true].includes(tag.tagValue);
        this._value['static'] = value;
        return;
      }

      var parent = this._node.parent;
      while (parent) {
        if (parent.type === 'MethodDefinition') {
          this._value['static'] = parent['static'];
          break;
        }
        parent = parent.parent;
      }
    }

    /** take out self name from self node */
  }, {
    key: '@_name',
    value: function _name() {
      var name = undefined;
      var tags = this._findAll(['@_name', '@_member']);
      if (tags) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = tags[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var tag = _step.value;
            var tagName = tag.tagName;
            var tagValue = tag.tagValue;

            if (tagName === '@_name') {
              name = tagValue;
            } else if (tagName === '@_member') {
              var _ParamParser$parseParamValue = _ParserParamParserJs2['default'].parseParamValue(tagValue, true, true, false);

              var paramName = _ParamParser$parseParamValue.paramName;

              name = paramName;
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
              _iterator['return']();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } else {
        var node = this._node;
        name = this._flattenMemberExpression(node.left).replace(/^this\./, '');
      }

      this._value.name = name;
    }

    /** borrow {@link MethodDoc#@_memberof} */
  }, {
    key: '@_memberof',
    value: function _memberof() {
      _MethodDocJs2['default'].prototype['@_memberof'].call(this);
    }

    /** if @type is not exists, guess type by using self node */
  }, {
    key: '@type',
    value: function type() {
      _get(Object.getPrototypeOf(MemberDoc.prototype), '@type', this).call(this);
      if (this._value.type) return;

      this._value.type = _ParserParamParserJs2['default'].guessType(this._node.right);
    }
  }]);

  return MemberDoc;
})(_AbstractDocJs2['default']);

exports['default'] = MemberDoc;
module.exports = exports['default'];