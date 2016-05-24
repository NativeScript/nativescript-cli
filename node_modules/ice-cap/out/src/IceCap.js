'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _colorLogger = require('color-logger');

var _colorLogger2 = _interopRequireDefault(_colorLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @ignore */
let logger = new _colorLogger2.default('IceCap');

/**
 * @class
 * @classdesc IceCap process HTML template with programmable.
 * @fileexample
 * import IceCap from 'ice-cap';
 * let ice = new IceCap('<p data-ice="name"></p>');
 * ice.text('name', 'Alice');
 * console.log(ice.html); // <p data-ice="name">Alice</p>
 */
class IceCap {
  static get MODE_APPEND() {
    return 'append';
  }
  static get MODE_WRITE() {
    return 'write';
  }
  static get MODE_REMOVE() {
    return 'remove';
  }
  static get MODE_PREPEND() {
    return 'prepend';
  }

  static get CALLBACK_TEXT() {
    return 'text';
  }
  static get CALLBACK_LOAD() {
    return 'html';
  }

  static set debug(v) {
    this._debug = v;
  }

  /**
   * create instance with HTML template.
   * @param {!string} html
   * @param {Object} [options]
   * @param {boolean} [options.autoDrop=true]
   * @param {boolean} [options.autoClose=true]
   */
  constructor(html) {
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? { autoClose: true, autoDrop: true } : arguments[1];

    var _ref$autoClose = _ref.autoClose;
    let autoClose = _ref$autoClose === undefined ? true : _ref$autoClose;
    var _ref$autoDrop = _ref.autoDrop;
    let autoDrop = _ref$autoDrop === undefined ? true : _ref$autoDrop;

    if (!html) {
      throw new Error('html must be specified.');
    }

    if (typeof html === 'string') {
      this._$root = _cheerio2.default.load(html).root();
    } else if (html.find) {
      this._$root = html;
    }
    this._options = { autoClose, autoDrop };
  }

  set autoDrop(val) {
    this._options.autoDrop = val;
  }

  get autoDrop() {
    return this._options.autoDrop;
  }

  set autoClose(val) {
    this._options.autoClose = val;
  }

  get autoClose() {
    return this._options.autoClose;
  }

  /**
   * apply value to DOM that is specified with id.
   * @param {!string} id
   * @param {string} value
   * @param {string} [mode=IceCap.MODE_APPEND]
   * @return {IceCap} self instance.
   */
  text(id, value) {
    let mode = arguments.length <= 2 || arguments[2] === undefined ? this.constructor.MODE_APPEND : arguments[2];

    var nodes = this._nodes(id);

    if (this._options.autoDrop && !value) {
      nodes.remove();
      return;
    }

    if (value === null || value === undefined) value = '';

    let transformedValue;
    for (var node of nodes.iterator) {
      let currentValue = node.text() || '';
      switch (mode) {
        case this.constructor.MODE_WRITE:
          transformedValue = value;
          break;
        case this.constructor.MODE_APPEND:
          transformedValue = currentValue + value;
          break;
        case this.constructor.MODE_REMOVE:
          transformedValue = currentValue.replace(new RegExp(value, 'g'), '');
          break;
        case this.constructor.MODE_PREPEND:
          transformedValue = value + currentValue;
          break;
        default:
          throw Error(`unknown mode. mode = "${ mode }"`);
      }

      node.text(transformedValue);
    }

    return this;
  }

  load(id, ice) {
    let mode = arguments.length <= 2 || arguments[2] === undefined ? this.constructor.MODE_APPEND : arguments[2];

    var html = '';
    if (ice instanceof IceCap) {
      html = ice.html;
    } else if (ice) {
      html = ice.toString();
    }

    var nodes = this._nodes(id);

    if (this._options.autoDrop && !html) {
      nodes.remove();
      return;
    }

    nodes.attr('data-ice-loaded', '1');
    let transformedValue;
    for (var node of nodes.iterator) {
      let currentValue = node.html() || '';
      switch (mode) {
        case this.constructor.MODE_WRITE:
          node.text('');
          transformedValue = html;
          break;
        case this.constructor.MODE_APPEND:
          transformedValue = currentValue + html;
          break;
        case this.constructor.MODE_REMOVE:
          transformedValue = currentValue.replace(new RegExp(html, 'g'), '');
          break;
        case this.constructor.MODE_PREPEND:
          transformedValue = html + currentValue;
          break;
        default:
          throw Error(`unknown mode. mode = "${ mode }"`);
      }

      node.html(transformedValue);
    }

    return this;
  }

  attr(id, key, value) {
    let mode = arguments.length <= 3 || arguments[3] === undefined ? this.constructor.MODE_APPEND : arguments[3];

    var nodes = this._nodes(id);
    var transformedValue;

    if (value === null || value === undefined) value = '';

    for (var node of nodes.iterator) {
      let currentValue = node.attr(key) || '';
      switch (mode) {
        case this.constructor.MODE_WRITE:
          transformedValue = value;
          break;
        case this.constructor.MODE_APPEND:
          transformedValue = currentValue + value;
          break;
        case this.constructor.MODE_REMOVE:
          transformedValue = currentValue.replace(new RegExp(value, 'g'), '');
          break;
        case this.constructor.MODE_PREPEND:
          transformedValue = value + currentValue;
          break;
        default:
          throw Error(`unknown mode. mode = "${ mode }"`);
      }

      node.attr(key, transformedValue);
    }

    return this;
  }

  loop(id, values, callback) {
    if (!Array.isArray(values)) {
      throw new Error(`values must be array. values = "${ values }"`);
    }

    if (['function', 'string'].indexOf(typeof callback) === -1) {
      throw new Error(`callback must be function. callback = "${ callback }"`);
    }

    if (typeof callback === 'string') {
      switch (callback) {
        case this.constructor.CALLBACK_TEXT:
          callback = (i, value, ice) => ice.text(id, value);
          break;
        case this.constructor.CALLBACK_LOAD:
          callback = (i, value, ice) => ice.load(id, value);
          break;
        default:
          throw Error(`unknown callback. callback = "${ callback }"`);
      }
    }

    var nodes = this._nodes(id);

    if (values.length === 0) {
      nodes.remove();
      return;
    }

    for (var node of nodes.iterator) {
      var results = [];
      for (let j = 0; j < values.length; j++) {
        let parent = _cheerio2.default.load('<div/>').root();
        let clonedNode = node.clone();
        let textNode = _cheerio2.default.load('\n').root();

        parent.append(clonedNode);
        results.push(clonedNode[0]);
        results.push(textNode[0]);

        let ice = new IceCap(parent);
        callback(j, values[j], ice);
      }

      if (node.parent().length) {
        node.parent().append(results);
      } else {
        this._$root.append(results);
      }
      node.remove();
    }

    return this;
  }

  into(id, value, callback) {
    let nodes = this._nodes(id);

    if (value === '' || value === null || value === undefined) {
      nodes.remove();
      return;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        nodes.remove();
        return;
      }
    }

    if (typeof callback !== 'function') {
      throw new Error(`callback must be function. callback = "${ callback }"`);
    }

    for (let node of nodes.iterator) {
      let ice = new IceCap(node);
      callback(value, ice);
    }

    return this;
  }

  drop(id) {
    let isDrop = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

    if (!isDrop) return;

    var nodes = this._nodes(id);
    nodes.remove();

    return this;
  }

  close() {
    if (!this._$root) return this;

    this._html = this._takeHTML();
    this._$root = null;
    return this;
  }

  get html() {
    if (!this._$root) return this._html;

    this._html = this._takeHTML();

    if (this._options.autoClose) {
      this.close();
    }

    return this._html;
  }

  _nodes(id) {
    if (!this._$root) throw new Error('can not operation after close.');
    if (!id) throw new Error('id must be specified.');

    var $nodes = this._$root.find(`[data-ice="${ id }"]`);

    var filtered = this._filter($nodes);

    if (filtered.length === 0 && this.constructor._debug) logger.w(`node not found. id = ${ id }`);

    return filtered;
  }

  _filter(nodes) {
    let results = [];
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes.eq(i);
      let length = node.parents('[data-ice-loaded]').length;
      if (length === 0) {
        results.push(node[0]);
      }
    }

    var $result = (0, _cheerio2.default)(results);

    Object.defineProperty($result, 'iterator', {
      get: function () {
        var nodes = [];
        for (var i = 0; i < this.length; i++) {
          nodes.push(this.eq(i));
        }
        return nodes;
      }
    });

    return $result;
  }

  _takeHTML() {
    var loadedNodes = this._$root.find('[data-ice-loaded]').removeAttr('data-ice-loaded');

    var html = this._$root.html();

    loadedNodes.attr('data-ice-loaded', 1);

    return html;
  }
}
exports.default = IceCap;