import Kinvey from './kinvey';

// Data
Kinvey.Collection = require('./core/collection');
Kinvey.Model = require('./core/model');
Kinvey.Query = require('./core/query');

// Enums
Kinvey.AuthType = require('./enums/authType');
Kinvey.DataPolicy = require('./enums/dataPolicy');
Kinvey.HttpMethod = require('./enums/httpMethod');
Kinvey.RackType = require('./enums/rackType');
Kinvey.StatusCode = require('./enums/statusCode');

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

// User
Kinvey.User = require('./core/user');

// Export
export default Kinvey;
