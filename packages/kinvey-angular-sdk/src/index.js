"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _acl = _interopRequireDefault(require("./acl"));

var _store = require("./cache/store");

var DataStore = _interopRequireWildcard(require("./datastore"));

var _kmd = _interopRequireDefault(require("./kmd"));

var _query = _interopRequireDefault(require("./query"));

var Files = _interopRequireWildcard(require("./files"));

var _endpoint = _interopRequireDefault(require("./endpoint"));

var _aggregation = _interopRequireDefault(require("./aggregation"));

var _init = _interopRequireDefault(require("./kinvey/init"));

var _initialize = _interopRequireDefault(require("./kinvey/initialize"));

var _appVersion = require("./kinvey/appVersion");

var _user = _interopRequireDefault(require("./user"));

// SDK
var SDK = {
  init: _init.default,
  initialize: _initialize.default,
  getAppVersion: _appVersion.get,
  setAppVersion: _appVersion.set,
  // Acl
  Acl: _acl.default,
  // Aggregation
  Aggregation: _aggregation.default,
  // DataStore
  DataStore: DataStore,
  DataStoreType: DataStore.DataStoreType,
  StorageProvider: _store.StorageProvider,
  // Custom Endpoint
  CustomEndpoint: {
    execute: _endpoint.default
  },
  // Files
  Files: Files,
  // Kmd
  Kmd: _kmd.default,
  Metadata: _kmd.default,
  // Query
  Query: _query.default,
  // User
  User: _user.default,
  AuthorizationGrant: _user.default.AuthorizationGrant
}; // Export

module.exports = SDK;