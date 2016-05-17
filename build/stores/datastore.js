'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileStore = exports.UserStore = exports.DataStore = exports.DataStoreReadPolicy = exports.DataStoreType = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../errors');

var _local = require('../requests/local');

var _deltafetch = require('../requests/deltafetch');

var _network = require('../requests/network');

var _enums = require('../enums');

var _query = require('../query');

var _client = require('../client');

var _client2 = _interopRequireDefault(_client);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _differenceBy = require('lodash/differenceBy');

var _differenceBy2 = _interopRequireDefault(_differenceBy);

var _keyBy = require('lodash/keyBy');

var _keyBy2 = _interopRequireDefault(_keyBy);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var idAttribute = '_id' || '_id';
var appdataNamespace = 'appdata' || 'appdata';
var usersNamespace = 'user' || 'user';
var rpcNamespace = 'rpc' || 'rpc';
var socialIdentityAttribute = '_socialIdentity' || '_socialIdentity';
var cacheEnabledSymbol = Symbol();

/**
 * Enum for DataStore types.
 */
var DataStoreType = {
  Cache: 'Cache',
  Network: 'Network',
  User: 'User',
  File: 'File'
};
Object.freeze(DataStoreType);
exports.DataStoreType = DataStoreType;

/**
 * Enum for DataStore read policy.
 */

var DataStoreReadPolicy = {
  Network: 'Network',
  Cache: 'Cache'
};
Object.freeze(DataStoreReadPolicy);
exports.DataStoreReadPolicy = DataStoreReadPolicy;

/**
 * The DataStore class is used to find, save, update, remove, count and group entities.
 */

var DataStore = exports.DataStore = function () {
  function DataStore(name) {
    _classCallCheck(this, DataStore);

    if (name && !(0, _isString2.default)(name)) {
      throw new _errors.KinveyError('Name must be a string.');
    }

    /**
     * @type {string}
     */
    this.name = name;

    /**
     * @type {DataStoreReadPolicy}
     */
    this.readPolicy = DataStoreReadPolicy.Network;

    /**
     * @type {Number|undefined}
     */
    this.ttl = undefined;

    /**
     * @type {Boolean}
     */
    this.useDeltaFetch = false;

    /**
     * @private
     * @type {Client}
     */
    this.client = _client2.default.sharedInstance();

    // Enable cache by default
    this.enableCache();
  }

  _createClass(DataStore, [{
    key: 'disableCache',


    /**
     * Disable cache.
     *
     * @return {DataStore}  DataStore instance.
     */
    value: function disableCache() {
      if (this.readPolicy === DataStoreReadPolicy.Cache) {
        throw new _errors.KinveyError('Unable to disable cache beacuse the read policy is set to ' + this.readPolicy + '. ' + 'Change the read policy to `DataStoreReadPolicy.Network` to disable the cache.');
      }

      this[cacheEnabledSymbol] = false;
      return this;
    }

    /**
     * Enable cache.
     *
     * @return {DataStore}  DataStore instance.
     */

  }, {
    key: 'enableCache',
    value: function enableCache() {
      this[cacheEnabledSymbol] = true;
      return this;
    }

    /**
     * Check if cache is enabled.
     *
     * @return {Boolean}  True of false depending on if cache is enabled or disabled.
     */

  }, {
    key: 'isCacheEnabled',
    value: function isCacheEnabled() {
      return this[cacheEnabledSymbol];
    }

    /**
     * Finds all entities in a collection. A query can be optionally provided to return
     * a subset of all entities in a collection or omitted to return all entities in
     * a collection. The number of entities returned adheres to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions.
     *
     * @param   {Query}                 [query]                                   Query used to filter result.
     * @param   {Object}                [options]                                 Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.\
     * @param   {Boolean}               [options.useDeltaFetch]                   Turn on or off the use of delta fetch
     *                                                                            for the find.
     * @return  {Promise|Object}                                                  Promise or object.
     */

  }, {
    key: 'find',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(query) {
        var _this = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var result, request;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                result = {};

                // Set default options

                options = (0, _assign2.default)({
                  useDeltaFetch: !!this.useDeltaFetch,
                  refresh: false
                });

                // Check that the query is valid

                if (!(query && !(query instanceof _query.Query))) {
                  _context.next = 4;
                  break;
                }

                throw new _errors.KinveyError('Invalid query. It must be an instance of the Query class.');

              case 4:

                // Fetch data from cache
                if (this.readPolicy === DataStoreReadPolicy.Cache && this.isCacheEnabled()) {
                  request = new _local.LocalRequest({
                    method: _enums.HttpMethod.GET,
                    url: _url2.default.format({
                      protocol: this.client.protocol,
                      host: this.client.host,
                      pathname: this.pathname
                    }),
                    properties: options.properties,
                    query: query,
                    timeout: options.timeout
                  });

                  result.cachePromise = request.execute().then(function (response) {
                    return response.data;
                  });
                }

                // Fetch data from the network
                if (this.readPolicy === DataStoreReadPolicy.Network || options.refresh === true) {
                  (function () {
                    var syncQuery = new _query.Query().equalTo('collection', _this.name);
                    var promise = void 0;

                    // Attempt to push any pending sync data before fetching from the network.
                    if (_this.isCacheEnabled()) {
                      promise = _this.syncCount(syncQuery);
                    } else {
                      promise = Promise.resolve(0);
                    }

                    result.networkPromise = promise.then(function (count) {
                      if (count > 0) {
                        return _this.push(syncQuery).then(function () {
                          return _this.syncCount(syncQuery);
                        });
                      }

                      return count;
                    }).then(function (count) {
                      if (count > 0) {
                        throw new _errors.KinveyError('Unable to load data from the network. There are ' + count + ' entities that need ' + 'to be synced before data is loaded from the network.');
                      }

                      // Use delta fetch request
                      if (options.useDeltaFetch) {
                        var _request = new _deltafetch.DeltaFetchRequest({
                          method: _enums.HttpMethod.GET,
                          authType: _enums.AuthType.Default,
                          url: _url2.default.format({
                            protocol: _this.client.protocol,
                            host: _this.client.host,
                            pathname: _this.pathname
                          }),
                          properties: options.properties,
                          query: query,
                          timeout: options.timeout,
                          client: _this.client
                        });
                        return _request.execute().then(function (response) {
                          return response.data;
                        });
                      }

                      // Use a network request
                      var request = new _network.NetworkRequest({
                        method: _enums.HttpMethod.GET,
                        authType: _enums.AuthType.Default,
                        url: _url2.default.format({
                          protocol: _this.client.protocol,
                          host: _this.client.host,
                          pathname: _this.pathname
                        }),
                        properties: options.properties,
                        query: query,
                        timeout: options.timeout,
                        client: _this.client
                      });
                      return request.execute().then(function (response) {
                        return response.data;
                      });
                    }).then(function (networkEntities) {
                      // Update the cache
                      if (_this.isCacheEnabled()) {
                        var removedEntities = (0, _differenceBy2.default)(result.cache, networkEntities, idAttribute);
                        var removedEntityIds = Object.keys((0, _keyBy2.default)(removedEntities, idAttribute));
                        var removeQuery = new _query.Query();
                        removeQuery.contains(idAttribute, removedEntityIds);
                        var _request2 = new _local.LocalRequest({
                          method: _enums.HttpMethod.DELETE,
                          url: _url2.default.format({
                            protocol: _this.client.protocol,
                            host: _this.client.host,
                            pathname: _this.pathname
                          }),
                          properties: options.properties,
                          query: removeQuery,
                          timeout: options.timeout
                        });
                        return _request2.execute().then(function () {
                          return _this.updateCache(networkEntities);
                        });
                      }

                      return networkEntities;
                    });
                  })();
                }

                // Return only what the user expects.

                if (!(result.cachePromise && !result.networkPromise)) {
                  _context.next = 10;
                  break;
                }

                return _context.abrupt('return', result.cachePromise);

              case 10:
                if (!(!result.cachePromise && result.networkPromise)) {
                  _context.next = 12;
                  break;
                }

                return _context.abrupt('return', result.networkPromise);

              case 12:
                _context.next = 14;
                return result.cachePromise;

              case 14:
                result.cache = _context.sent;

                delete result.cachePromise;
                return _context.abrupt('return', result);

              case 17:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function find(_x, _x2) {
        return ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'readPolicy',
    get: function get() {
      return this.dataStoreReadPolicy;
    },
    set: function set(readPolicy) {
      switch (readPolicy) {
        case DataStoreReadPolicy.Network:
          this.dataStoreReadPolicy = readPolicy;
          break;
        case DataStoreReadPolicy.Cache:
          if (!this.isCacheEnabled()) {
            throw new _errors.KinveyError('Unable to use read policy ' + readPolicy + ' because the cache is disabled. ' + 'Please enable cache by calling `dataStore.enableCache()` to use this read policy.');
          }

          this.dataStoreReadPolicy = readPolicy;
          break;
        default:
          throw new _errors.KinveyError('Unrecognized read policy. Please use a valid read policy.', readPolicy);
      }
    }

    /**
     * The pathname for the store.
     *
     * @return  {string}  Pathname
     */

  }, {
    key: 'pathname',
    get: function get() {
      var pathname = '/' + appdataNamespace;

      if (this.client) {
        pathname = pathname + '/' + this.client.appKey;
      }

      if (this.name) {
        pathname = pathname + '/' + this.name;
      }

      return pathname;
    }
  }]);

  return DataStore;
}();

/**
 * The UserStore class is used to find, save, update, remove, count and group users.
 */


var UserStore = exports.UserStore = function (_DataStore) {
  _inherits(UserStore, _DataStore);

  function UserStore() {
    _classCallCheck(this, UserStore);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(UserStore).apply(this, arguments));
  }

  _createClass(UserStore, [{
    key: 'save',
    value: function save(user) {
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = Promise.resolve().then(function () {
        if (!user) {
          throw new _errors.KinveyError('No user was provided to be updated.');
        }

        if (isArray(user)) {
          throw new _errors.KinveyError('Please only update one user at a time.', user);
        }

        if (!user[idAttribute]) {
          throw new _errors.KinveyError('User must have an _id.');
        }

        if (options._identity) {
          var socialIdentity = user[socialIdentityAttribute];
          if (socialIdentity) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = socialIdentity[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _step$value = _slicedToArray(_step.value, 1);

                var key = _step$value[0];

                if (socialIdentity[key] && options._identity !== key) {
                  delete socialIdentity[key];
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          }
        }

        return _get(Object.getPrototypeOf(UserStore.prototype), 'save', _this3).call(_this3, user, options);
      });

      return promise;
    }
  }, {
    key: 'exists',
    value: function exists(username, options) {
      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        authType: _enums.AuthType.App,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: '/' + rpcNamespace + '/' + this.client.appKey + '/check-username-exists'
        }),
        properties: options.properties,
        data: { username: username },
        timeout: options.timeout,
        client: this.client
      });

      var promise = request.execute().then(function (response) {
        return response.data.usernameExists;
      });
      return promise;
    }
  }, {
    key: 'restore',
    value: function restore(id) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        authType: _enums.AuthType.Master,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname + '/id'
        }),
        properties: options.properties,
        timeout: options.timeout,
        client: this.client
      });

      var promise = request.execute().then(function (response) {
        return response.data;
      });
      return promise;
    }
  }, {
    key: 'pathname',

    /**
     * The pathname for the store.
     *
     * @return  {string}   Pathname
     */
    get: function get() {
      return '/' + usersNamespace + '/' + this.client.appKey;
    }
  }]);

  return UserStore;
}(DataStore);

/**
 * The FileStore class is used to find, save, update, remove, count and group files.
 */


var FileStore = exports.FileStore = function (_DataStore2) {
  _inherits(FileStore, _DataStore2);

  function FileStore() {
    _classCallCheck(this, FileStore);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(FileStore).apply(this, arguments));
  }

  _createClass(FileStore, [{
    key: 'find',


    /**
     * Finds all files. A query can be optionally provided to return
     * a subset of all the files for your application or omitted to return all the files.
     * The number of files returned will adhere to the limits specified
     * at http://devcenter.kinvey.com/rest/guides/datastore#queryrestrictions. A
     * promise will be returned that will be resolved with the files or rejected with
     * an error.
     *
     * @param   {Query}                 [query]                                   Query used to filter result.
     * @param   {Object}                [options]                                 Options
     * @param   {Properties}            [options.properties]                      Custom properties to send with
     *                                                                            the request.
     * @param   {Number}                [options.timeout]                         Timeout for the request.
     * @param   {Boolean}               [options.tls]                             Use Transport Layer Security
     * @param   {Boolean}               [options.download]                        Download the files
     * @return  {Promise}                                                         Promise
     *
     * @example
     * var filesStore = new Kinvey.FilesStore();
     * var query = new Kinvey.Query();
     * query.equalTo('location', 'Boston');
     * files.find(query, {
     *   tls: true, // Use transport layer security
     *   ttl: 60 * 60 * 24, // 1 day in seconds
     *   download: true // download the files
     * }).then(function(files) {
     *   ...
     * }).catch(function(err) {
     *   ...
     * });
     */
    value: function find(query) {
      var _this5 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _assign2.default)({
        download: false,
        tls: false
      }, options);

      options.flags = {
        tls: options.tls === true,
        ttl_in_seconds: options.ttl
      };

      var promise = _get(Object.getPrototypeOf(FileStore.prototype), 'find', this).call(this, query, options).then(function (files) {
        if (options.download === true) {
          var promises = map(files, function (file) {
            return _this5.downloadByUrl(file._downloadURL, options);
          });
          return Promise.all(promises);
        }

        return files;
      });

      return promise;
    }
  }, {
    key: 'findById',
    value: function findById(id, options) {
      return this.download(id, options);
    }

    /**
     * Download a file. A promise will be returned that will be resolved with the file or rejected with
     * an error.
     *
     * @param   {string}        name                                          Name
     * @param   {Object}        [options]                                     Options
     * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
     * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
     * @param   {Boolean}       [options.stream]                              Stream the file
     * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.NetworkFirst]    Data policy
     * @param   {AuthType}      [options.authType=AuthType.Default]           Auth type
     * @return  {Promise}                                                     Promise
     *
     * @example
     * var files = new Kinvey.Files();
     * files.download('BostonTeaParty.png', {
     *   tls: true, // Use transport layer security
     *   ttl: 60 * 60 * 24, // 1 day in seconds
     *   stream: true // stream the file
     * }).then(function(file) {
     *   ...
     * }).catch(function(err) {
     *   ...
     * });
     */

  }, {
    key: 'download',
    value: function download(name) {
      var _this6 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options = (0, _assign2.default)({
        stream: false,
        tls: false
      }, options);

      options.flags = {
        tls: options.tls === true,
        ttl_in_seconds: options.ttl
      };

      var promise = _get(Object.getPrototypeOf(FileStore.prototype), 'findById', this).call(this, name, options).then(function (file) {
        if (options.stream === true) {
          return file;
        }

        return _this6.downloadByUrl(file._downloadURL, options);
      });

      return promise;
    }
  }, {
    key: 'downloadByUrl',
    value: function downloadByUrl(url) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = Promise.resolve().then(function () {
        var request = new _network.NetworkRequest({
          method: _enums.HttpMethod.GET,
          url: url,
          timeout: options.timeout
        });
        request.setHeader('Accept', options.mimeType || 'application-octet-stream');
        request.removeHeader('Content-Type');
        request.removeHeader('X-Kinvey-Api-Version');
        return request.execute();
      }).then(function (response) {
        return response.data;
      });

      return promise;
    }

    /**
     * Stream a file. A promise will be returned that will be resolved with the file or rejected with
     * an error.
     *
     * @param   {string}        name                                          File name
     * @param   {Object}        [options]                                     Options
     * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
     * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
     * @param   {DataPolicy}    [options.dataPolicy=DataPolicy.NetworkFirst]    Data policy
     * @param   {AuthType}      [options.authType=AuthType.Default]           Auth type
     * @return  {Promise}                                                     Promise
     *
     * @example
     * var files = new Kinvey.Files();
     * files.stream('BostonTeaParty.png', {
     *   tls: true, // Use transport layer security
     *   ttl: 60 * 60 * 24, // 1 day in seconds
     * }).then(function(file) {
     *   ...
     * }).catch(function(err) {
     *   ...
     * });
     */

  }, {
    key: 'stream',
    value: function stream(name) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      options.stream = true;
      return this.download(name, options);
    }
  }, {
    key: 'upload',
    value: function upload(file) {
      var metadata = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      metadata._filename = metadata._filename || file._filename || file.name;
      metadata.size = metadata.size || file.size || file.length;
      metadata.mimeType = metadata.mimeType || file.mimeType || file.type || 'application/octet-stream';

      options = (0, _assign2.default)({
        properties: null,
        timeout: undefined,
        public: false,
        handler: function handler() {}
      }, options);

      if (options.public) {
        metadata._public = true;
      }

      var request = new _network.NetworkRequest({
        method: _enums.HttpMethod.POST,
        headers: {
          'X-Kinvey-Content-Type': metadata.mimeType
        },
        authType: _enums.AuthType.Default,
        url: _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname
        }),
        properties: options.properties,
        timeout: options.timeout,
        data: metadata,
        client: this.client
      });

      if (metadata[idAttribute]) {
        request.method = _enums.HttpMethod.PUT;
        request.url = _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname + '/' + metadata._id
        });
      }

      var promise = request.execute().then(function (response) {
        var uploadUrl = response.data._uploadURL;
        var headers = response.data._requiredHeaders || {};
        headers['Content-Type'] = metadata.mimeType;
        headers['Content-Length'] = metadata.size;

        // Delete fields from the response
        delete response.data._expiresAt;
        delete response.data._requiredHeaders;
        delete response.data._uploadURL;

        // Upload the file
        var request = new _network.NetworkRequest({
          method: _enums.HttpMethod.PUT,
          url: uploadUrl,
          data: file
        });
        request.clearHeaders();
        request.addHeaders(headers);

        return request.execute().then(function (uploadResponse) {
          if (uploadResponse.isSuccess()) {
            response.data._data = file;
            return response.data;
          }

          throw uploadResponse.error;
        });
      });

      return promise;
    }
  }, {
    key: 'save',
    value: function save() {
      return Promise.reject(new _errors.KinveyError('Please use `upload()` to save files.'));
    }
  }, {
    key: 'update',
    value: function update() {
      return Promise.reject(new _errors.KinveyError('Please use `upload()` to update files.'));
    }
  }, {
    key: 'pathname',

    /**
     * The pathname for the store.
     *
     * @return  {string}                Pathname
     */
    get: function get() {
      return '/' + filesNamespace + '/' + this.client.appKey;
    }
  }]);

  return FileStore;
}(DataStore);

/**
 * Returns an instance of the Store class based on the type provided.
 *
 * @param  {string}       [name]                        Name of the collection.
 * @param  {StoreType}    [type=DataStoreType.Network]  Type of store to return.
 * @return {DataStore}                                  DataStore instance.
 */


DataStore.collection = function (name) {
  var type = arguments.length <= 1 || arguments[1] === undefined ? DataStoreType.Network : arguments[1];

  var store = new DataStore(name);

  switch (type) {
    case DataStoreType.User:
      store = new UserStore();
      break;
    case DataStoreType.File:
      store = new FileStore();
      break;
    case DataStoreType.Cache:
      store.readPolicy = DataStoreReadPolicy.Cache;
      break;
    case DataStoreType.Network:
    default:
      store.readPolicy = DataStoreReadPolicy.Network;
  }

  return store;
};