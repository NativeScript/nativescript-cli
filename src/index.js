import Kinvey from './kinvey';
import DataStore from './core/datastore';
import Log from './core/logger';
import Middleware from './middleware/middleware';
import Cache from './middleware/cache';
import Database from './middleware/database';
import Http from './middleware/http';
import Parser from './middleware/parser';
import Serializer from './middleware/serializer';
import Rack from './core/rack';
import User from './core/user';

// DataStore
Kinvey.DataStore = DataStore;

// Utils
Kinvey.Log = Log;

// Middleware
Kinvey.Middleware = Middleware;
Kinvey.Middleware.Cache = Cache;
Kinvey.Middleware.Database = Database;
Kinvey.Middleware.Http = Http;
Kinvey.Middleware.Parser = Parser;
Kinvey.Middleware.Serializer = Serializer;

// Rack
Kinvey.Rack = Rack;

// User
Kinvey.User = User;

// Export
export default Kinvey;
