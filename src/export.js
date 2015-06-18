let Kinvey = require('./kinvey');

Kinvey.Defer = require('./core/defer');
Kinvey.LocalDataStore = require('./core/localDataStore');
Kinvey.Log = require('./core/logger');
Kinvey.Middleware = require('./middleware/middleware');
Kinvey.Middleware.Cache = require('./middleware/cache');
Kinvey.Middleware.Http = require('./middleware/http');
Kinvey.Middleware.Parser = require('./middleware/parser');
Kinvey.Middleware.Serializer = require('./middleware/serializer');
Kinvey.Rack = require('./core/rack');
Kinvey.Session = require('./core/session');
Kinvey.User = require('./core/user');

export default Kinvey;
