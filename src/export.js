let Kinvey = require('./kinvey');

// DataStore
Kinvey.DataStore = require('./core/datastore');

// Utils
Kinvey.Defer = require('./core/defer');
Kinvey.Log = require('./core/logger');

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
Kinvey.Session = require('./core/session');
Kinvey.User = require('./core/user');

export default Kinvey;
