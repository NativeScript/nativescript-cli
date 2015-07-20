import Kinvey from './kinvey';

// DataStore
Kinvey.DataStore = require('./core/datastore');

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
