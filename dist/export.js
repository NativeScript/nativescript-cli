'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _datastore = require('./datastore');

Object.keys(_datastore).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _datastore[key];
    }
  });
});

var _entity = require('./entity');

Object.keys(_entity).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _entity[key];
    }
  });
});

var _request = require('./request');

Object.keys(_request).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _request[key];
    }
  });
});

var _social = require('./social');

Object.keys(_social).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _social[key];
    }
  });
});

var _utils = require('./utils');

Object.keys(_utils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _utils[key];
    }
  });
});

var _aggregation = require('./aggregation');

Object.keys(_aggregation).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aggregation[key];
    }
  });
});

var _client = require('./client');

Object.keys(_client).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _client[key];
    }
  });
});

var _endpoint = require('./endpoint');

Object.keys(_endpoint).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _endpoint[key];
    }
  });
});

var _errors = require('./errors');

Object.keys(_errors).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _errors[key];
    }
  });
});

var _kinvey = require('./kinvey');

Object.keys(_kinvey).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _kinvey[key];
    }
  });
});

var _query = require('./query');

Object.keys(_query).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _query[key];
    }
  });
});