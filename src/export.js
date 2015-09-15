import Kinvey from './kinvey';

// Core
Kinvey.Acl = require('./core/acl');
Kinvey.Aggregation = require('./core/aggregation');
Kinvey.Datastore = require('./core/datastore');
Kinvey.Group = require('./core/group');
Kinvey.Metadata = require('./core/metadata');
Kinvey.Query = require('./core/query');
Kinvey.User = require('./core/user');

// Enums
Kinvey.AuthType = require('./core/enums/authType');
Kinvey.DataPolicy = require('./core/enums/dataPolicy');
Kinvey.HttpMethod = require('./core/enums/httpMethod');
Kinvey.RackType = require('./core/enums/rackType');
Kinvey.StatusCode = require('./core/enums/statusCode');

// Errors
Kinvey.Error = require('./core/errors/error');
Kinvey.ActiveUserError = require('./core/errors/activeUserError');
Kinvey.NotFoundError = require('./core/errors/notFoundError');

// Middleware
Kinvey.Middleware = require('./middleware/middleware');
Kinvey.Middleware.Cache = require('./middleware/cache');
Kinvey.Middleware.Database = require('./middleware/database');
Kinvey.Middleware.Http = require('./middleware/http');
Kinvey.Middleware.Parser = require('./middleware/parser');
Kinvey.Middleware.Serializer = require('./middleware/serializer');

// Rack
Kinvey.Rack = require('./core/rack');

// Export
export default Kinvey;
