let Kinvey = require('./kinvey');

Kinvey.DataStore = require('./core/datastore');
Kinvey.Defer = require('./core/defer');
Kinvey.Middleware = require('./middleware/middleware');
Kinvey.Middleware.Cache = require('./middleware/cache');
Kinvey.Middleware.Http = require('./middleware/http');
Kinvey.Middleware.Parser = require('./middleware/parser');
Kinvey.Middleware.Serializer = require('./middleware/serializer');
Kinvey.Rack = require('./core/rack');
Kinvey.User = require('./core/user');

export default Kinvey;
