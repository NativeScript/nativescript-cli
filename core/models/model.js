'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _acl = require('../acl');

var _acl2 = _interopRequireDefault(_acl);

var _metadata = require('../metadata');

var _metadata2 = _interopRequireDefault(_metadata);

var _client = require('../client');

var _client2 = _interopRequireDefault(_client);

var _defaults = require('lodash/defaults');

var _defaults2 = _interopRequireDefault(_defaults);

var _result = require('lodash/result');

var _result2 = _interopRequireDefault(_result);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var localIdPrefix = process.env.KINVEY_ID_PREFIX || 'local_';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var aclAttribute = process.env.KINVEY_ACL_ATTRIBUTE || '_acl';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

/**
 * @private
 */

var Model = function () {
  function Model() {
    var attributes = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Model);

    this.client = _client2.default.sharedInstance();
    this.set((0, _defaults2.default)({}, attributes, (0, _result2.default)(this, 'defaults', {})));
  }

  _createClass(Model, [{
    key: 'get',
    value: function get(attr) {
      return this.attributes[attr];
    }
  }, {
    key: 'has',
    value: function has(attr) {
      return this.get(attr) ? true : false;
    }
  }, {
    key: 'set',
    value: function set(key, val) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (!key) {
        return this;
      }

      var attrs = undefined;
      if ((typeof key === 'undefined' ? 'undefined' : _typeof(key)) === 'object') {
        attrs = key;
        options = val || {};
      } else {
        (attrs = {})[key] = val;
      }

      var unset = options.unset;
      var currentAttributes = (0, _clone2.default)(this.attributes || {});

      for (var attr in attrs) {
        if (attrs.hasOwnProperty(attr)) {
          val = attrs[attr];

          if (unset) {
            delete currentAttributes[attr];
          } else {
            currentAttributes[attr] = val;
          }
        }
      }

      this.attributes = currentAttributes;
      return this;
    }
  }, {
    key: 'unset',
    value: function unset(attr) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return this.set(attr, undefined, (0, _assign2.default)({}, options, { unset: true }));
    }
  }, {
    key: 'isNew',
    value: function isNew() {
      return !this.has(idAttribute) || this.id.indexOf(localIdPrefix) === 0;
    }
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return (0, _clone2.default)(this.attributes, true);
    }
  }, {
    key: 'id',
    get: function get() {
      return this.get(idAttribute);
    },
    set: function set(id) {
      this.set(idAttribute, id);
    }
  }, {
    key: '_id',
    get: function get() {
      return this.id;
    },
    set: function set(id) {
      this.id = id;
    }
  }, {
    key: 'acl',
    get: function get() {
      return new _acl2.default(this.get(aclAttribute));
    },
    set: function set(acl) {
      this.set(aclAttribute, (0, _result2.default)(acl, 'toJSON', acl));
    }
  }, {
    key: '_acl',
    get: function get() {
      return this.acl;
    },
    set: function set(kmd) {
      this.kmd = kmd;
    }
  }, {
    key: 'metadata',
    get: function get() {
      return new _metadata2.default(this.get(kmdAttribute));
    }
  }, {
    key: '_kmd',
    get: function get() {
      return this.get(kmdAttribute);
    },
    set: function set(kmd) {
      this.set(kmdAttribute, (0, _result2.default)(kmd, 'toJSON', kmd));
    }
  }, {
    key: 'defaults',
    get: function get() {
      var defaults = {};
      return defaults;
    }
  }]);

  return Model;
}();

exports.default = Model;