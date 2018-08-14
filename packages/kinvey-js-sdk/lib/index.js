'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sdk;

var _http = require('./http');

var _acl = require('./acl');

var _acl2 = _interopRequireDefault(_acl);

var _aggregation = require('./aggregation');

var _aggregation2 = _interopRequireDefault(_aggregation);

var _client = require('./client');

var _kmd = require('./kmd');

var _kmd2 = _interopRequireDefault(_kmd);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

var _identity = require('./identity');

var User = _interopRequireWildcard(_identity);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sdk(httpAdapter) {
  // Use the provided http adapter
  (0, _http.use)(httpAdapter);

  // Return the sdk object
  return {
    init: _client.init,

    // Acl
    Acl: _acl2.default,

    // Aggregation
    Aggregation: _aggregation2.default,

    // Kmd
    Kmd: _kmd2.default,
    Metadata: _kmd2.default, // Deprecated

    // Query
    Query: _query2.default,

    // User
    User: User
  };
}