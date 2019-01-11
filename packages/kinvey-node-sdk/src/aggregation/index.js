"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _aggregation = _interopRequireDefault(require("./aggregation"));

var _average = _interopRequireDefault(require("./average"));

var _count = _interopRequireDefault(require("./count"));

var _max = _interopRequireDefault(require("./max"));

var _min = _interopRequireDefault(require("./min"));

var _sum = _interopRequireDefault(require("./sum"));

_aggregation.default.average = _average.default;
_aggregation.default.count = _count.default;
_aggregation.default.max = _max.default;
_aggregation.default.min = _min.default;
_aggregation.default.sum = _sum.default;
var _default = _aggregation.default;
exports.default = _default;