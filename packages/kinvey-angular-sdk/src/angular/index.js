"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Acl", {
  enumerable: true,
  get: function get() {
    return _acl.default;
  }
});
Object.defineProperty(exports, "Aggregation", {
  enumerable: true,
  get: function get() {
    return _aggregation.default;
  }
});
Object.defineProperty(exports, "StorageProvider", {
  enumerable: true,
  get: function get() {
    return _store.StorageProvider;
  }
});
Object.defineProperty(exports, "DataStoreType", {
  enumerable: true,
  get: function get() {
    return _datastore.DataStoreType;
  }
});
Object.defineProperty(exports, "Query", {
  enumerable: true,
  get: function get() {
    return _query.default;
  }
});
Object.defineProperty(exports, "getAppVersion", {
  enumerable: true,
  get: function get() {
    return _appVersion.get;
  }
});
Object.defineProperty(exports, "setAppVersion", {
  enumerable: true,
  get: function get() {
    return _appVersion.set;
  }
});
Object.defineProperty(exports, "Kmd", {
  enumerable: true,
  get: function get() {
    return _kmd.default;
  }
});
Object.defineProperty(exports, "Metadata", {
  enumerable: true,
  get: function get() {
    return _kmd.default;
  }
});
Object.defineProperty(exports, "DataStoreService", {
  enumerable: true,
  get: function get() {
    return _datastore2.default;
  }
});
Object.defineProperty(exports, "EndpointService", {
  enumerable: true,
  get: function get() {
    return _endpoint.default;
  }
});
Object.defineProperty(exports, "FilesService", {
  enumerable: true,
  get: function get() {
    return _files.default;
  }
});
Object.defineProperty(exports, "KinveyModule", {
  enumerable: true,
  get: function get() {
    return _kinvey.default;
  }
});
Object.defineProperty(exports, "PingService", {
  enumerable: true,
  get: function get() {
    return _ping.default;
  }
});
Object.defineProperty(exports, "UserService", {
  enumerable: true,
  get: function get() {
    return _user.default;
  }
});

var _acl = _interopRequireDefault(require("../acl"));

var _aggregation = _interopRequireDefault(require("../aggregation"));

var _store = require("../cache/store");

var _datastore = require("../datastore");

var _query = _interopRequireDefault(require("../query"));

var _appVersion = require("../kinvey/appVersion");

var _kmd = _interopRequireDefault(require("../kmd"));

var _datastore2 = _interopRequireDefault(require("./datastore.service"));

var _endpoint = _interopRequireDefault(require("./endpoint.service"));

var _files = _interopRequireDefault(require("./files.service"));

var _kinvey = _interopRequireDefault(require("./kinvey.module"));

var _ping = _interopRequireDefault(require("./ping.service"));

var _user = _interopRequireDefault(require("./user.service"));