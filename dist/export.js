'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Users = exports.UserStore = exports.User = exports.SocialIdentity = exports.Query = exports.Metadata = exports.Log = exports.Kinvey = exports.Files = exports.File = exports.DataStoreType = exports.DataStore = exports.CustomEndpoint = exports.AuthorizationGrant = exports.Group = exports.Aggregation = exports.Acl = undefined;

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

var _aggregation = require('./aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _datastore = require('./datastore');

var _datastore2 = _interopRequireDefault(_datastore);

var _endpoint = require('./endpoint');

var _entity = require('./entity');

var _identity = require('./identity');

var _kinvey = require('./kinvey');

var _kinvey2 = _interopRequireDefault(_kinvey);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Acl = _entity.Acl;
exports.Aggregation = _aggregation2.default;
exports.Group = _aggregation2.default;
exports.AuthorizationGrant = _identity.AuthorizationGrant;
exports.CustomEndpoint = _endpoint.CustomEndpoint;
exports.DataStore = _datastore2.default;
exports.DataStoreType = _datastore.DataStoreType;
exports.File = _datastore.FileStore;
exports.Files = _datastore.FileStore;
exports.Kinvey = _kinvey2.default;
exports.Log = _utils.Log;
exports.Metadata = _entity.Metadata;
exports.Query = _query2.default;
exports.SocialIdentity = _identity.SocialIdentity;
exports.User = _entity.User;
exports.UserStore = _datastore.UserStore;
exports.Users = _datastore.UserStore;
exports.default = _kinvey2.default;