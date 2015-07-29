import Kinvey from './kinvey';

// Data
Kinvey.Collection = require('./core/collection');
Kinvey.Model = require('./core/model');

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

// Errors
Kinvey.Error = require('./core/errors/error');
Kinvey.ActiveUserError = require('./core/errors/activeUserError');
Kinvey.NotFoundError = require('./core/errors/notFoundError');

// Export
export default Kinvey;
