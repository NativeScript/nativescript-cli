'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Device = undefined;

var _object = require('./object');

/**
 * @private
 */
var Device = exports.Device = {
  toJSON: function toJSON() {
    throw new Error('method unsupported');
  }
};

Device.use = (0, _object.use)(['toJSON']);