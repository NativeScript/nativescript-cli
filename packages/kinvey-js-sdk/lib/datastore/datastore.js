"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataStore = function DataStore(appKey, collectionName) {
  _classCallCheck(this, DataStore);

  this.appKey = appKey;
  this.collectionName = collectionName;
};

exports.default = DataStore;