'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _network = require('./requests/network');

var _request = require('./requests/request');

var _datastore = require('./datastore');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-disable no-underscore-dangle */


var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var filesNamespace = process.env.KINVEY_FILES_NAMESPACE || 'blob';

/**
 * The FileStore class is used to find, save, update, remove, count and group files.
 */

var FileStore = exports.FileStore = function (_DataStore) {
  _inherits(FileStore, _DataStore);

  function FileStore() {
    _classCallCheck(this, FileStore);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(FileStore).call(this));

    _this.disableCache();
    return _this;
  }

  /**
   * Enable cache.
   *
   * @return {DataStore}  DataStore instance.
   */


  _createClass(FileStore, [{
    key: 'enableCache',
    value: function enableCache() {}
    // Log a warning
    // throw new KinveyError('Unable to enable cache for the file store.');


    /**
     * Make the store offline.
     *
     * @return {DataStore}  DataStore instance.
     */

  }, {
    key: 'offline',
    value: function offline() {}
    // Log a warning
    // throw new KinveyError('Unable to go offline for the file store.');


    /**
     * The pathname for the store.
     *
     * @return  {string}  Pathname
     */

  }, {
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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(query) {
        var _this2 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var stream, files;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options.query = options.query || {};
                options.query.tls = options.tls === true;
                options.ttl_in_seconds = options.ttl;

                stream = _get(Object.getPrototypeOf(FileStore.prototype), 'find', this).call(this, query, options);
                _context.next = 6;
                return stream.toPromise();

              case 6:
                files = _context.sent;

                if (!(options.download === true)) {
                  _context.next = 9;
                  break;
                }

                return _context.abrupt('return', Promise.all((0, _map2.default)(files, function (file) {
                  return _this2.downloadByUrl(file._downloadURL, options);
                })));

              case 9:
                return _context.abrupt('return', files);

              case 10:
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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(name) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var stream, file;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                options.query = options.query || {};
                options.query.tls = options.tls === true;
                options.ttl_in_seconds = options.ttl;

                stream = _get(Object.getPrototypeOf(FileStore.prototype), 'findById', this).call(this, name, options);
                _context2.next = 6;
                return stream.toPromise();

              case 6:
                file = _context2.sent;

                if (!(options.stream === true)) {
                  _context2.next = 9;
                  break;
                }

                return _context2.abrupt('return', file);

              case 9:
                return _context2.abrupt('return', this.downloadByUrl(file._downloadURL, options));

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function download(_x4, _x5) {
        return ref.apply(this, arguments);
      }

      return download;
    }()
  }, {
    key: 'downloadByUrl',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(url) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var config, request, response;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                config = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.GET,
                  url: url,
                  timeout: options.timeout
                });

                config.headers.set('Accept', options.mimeType || 'application-octet-stream');
                config.headers.remove('Content-Type');
                config.headers.remove('X-Kinvey-Api-Version');
                request = new _network.NetworkRequest(config);
                _context3.next = 7;
                return request.execute();

              case 7:
                response = _context3.sent;
                return _context3.abrupt('return', response.data);

              case 9:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function downloadByUrl(_x7, _x8) {
        return ref.apply(this, arguments);
      }

      return downloadByUrl;
    }()

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
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(file) {
        var metadata = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var createConfig, createRequest, createResponse, data, uploadUrl, headers, uploadConfig, uploadRequest;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                metadata._filename = metadata._filename || file._filename || file.name;
                metadata.size = metadata.size || file.size || file.length;
                metadata.mimeType = metadata.mimeType || file.mimeType || file.type || 'application/octet-stream';

                if (options.public === true) {
                  metadata._public = true;
                }

                createConfig = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.Default,
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

                createConfig.headers.set('X-Kinvey-Content-Type', metadata.mimeType);
                createRequest = new _network.NetworkRequest(createConfig);


                if (metadata[idAttribute]) {
                  createRequest.method = _request.RequestMethod.PUT;
                  createRequest.url = _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/' + metadata._id,
                    query: options.query
                  });
                }

                _context4.next = 10;
                return createRequest.execute();

              case 10:
                createResponse = _context4.sent;
                data = createResponse.data;
                uploadUrl = data._uploadURL;
                headers = data._requiredHeaders || {};

                headers['Content-Type'] = metadata.mimeType;
                headers['Content-Length'] = metadata.size;

                // Delete fields from the response
                delete data._expiresAt;
                delete data._requiredHeaders;
                delete data._uploadURL;

                // Upload the file
                uploadConfig = new _request.KinveyRequestConfig({
                  method: _request.RequestMethod.PUT,
                  url: uploadUrl,
                  data: file
                });

                uploadConfig.headers.clear();
                uploadConfig.headers.add(headers);
                uploadRequest = new _network.NetworkRequest(uploadConfig);
                _context4.next = 25;
                return uploadRequest.execute();

              case 25:

                data._data = file;
                return _context4.abrupt('return', data);

              case 27:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function upload(_x11, _x12, _x13) {
        return ref.apply(this, arguments);
      }

      return upload;
    }()
  }, {
    key: 'create',
    value: function create(file, metadata, options) {
      return this.upload(file, metadata, options);
    }
  }, {
    key: 'update',
    value: function update(file, metadata, options) {
      return this.upload(file, metadata, options);
    }
  }, {
    key: 'pathname',
    get: function get() {
      return '/' + filesNamespace + '/' + this.client.appKey;
    }
  }]);

  return FileStore;
}(_datastore.DataStore);