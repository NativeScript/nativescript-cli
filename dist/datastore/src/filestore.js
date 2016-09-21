'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileStore = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('../../request');

var _errors = require('../../errors');

var _networkstore = require('./networkstore');

var _utils = require('../../utils');

var _pinkie = require('pinkie');

var _pinkie2 = _interopRequireDefault(_pinkie);

var _regeneratorRuntime = require('regenerator-runtime');

var _regeneratorRuntime2 = _interopRequireDefault(_regeneratorRuntime);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _pinkie2.default(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return _pinkie2.default.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // eslint-disable-line no-unused-vars


var idAttribute = process && process.env && process.env.KINVEY_ID_ATTRIBUTE || '_id' || '_id';
var filesNamespace = process && process.env && process.env.KINVEY_FILES_NAMESPACE || 'blob' || 'blob';
var MAX_BACKOFF = process && process.env && process.env.KINVEY_MAX_BACKOFF || '32000' || 32 * 1000;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Calculate where we should start the file upload
function getStartIndex(rangeHeader, max) {
  var start = rangeHeader ? parseInt(rangeHeader.split('-')[1], 10) + 1 : 0;
  return start >= max ? max - 1 : start;
}

/**
 * The FileStore class is used to find, save, update, remove, count and group files.
 */

var FileStore = exports.FileStore = function (_NetworkStore) {
  _inherits(FileStore, _NetworkStore);

  function FileStore() {
    _classCallCheck(this, FileStore);

    return _possibleConstructorReturn(this, (FileStore.__proto__ || Object.getPrototypeOf(FileStore)).apply(this, arguments));
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
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee(query) {
        var _this2 = this;

        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var stream, files;
        return _regeneratorRuntime2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options.query = options.query || {};
                options.query.tls = options.tls === true;

                if ((0, _isNumber2.default)(options.ttl)) {
                  options.query.ttl_in_seconds = options.ttl;
                }

                stream = _get(FileStore.prototype.__proto__ || Object.getPrototypeOf(FileStore.prototype), 'find', this).call(this, query, options);
                _context.next = 6;
                return stream.toPromise();

              case 6:
                files = _context.sent;

                if (!(options.download === true)) {
                  _context.next = 9;
                  break;
                }

                return _context.abrupt('return', _pinkie2.default.all((0, _map2.default)(files, function (file) {
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
        return _ref.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'findById',
    value: function findById(id, options) {
      return this.download(id, options);
    }

    /**
     * Download a file.
     *
     * @param   {string}        name                                          Name
     * @param   {Object}        [options]                                     Options
     * @param   {Boolean}       [options.tls]                                 Use Transport Layer Security
     * @param   {Number}        [options.ttl]                                 Time To Live (in seconds)
     * @param   {Boolean}       [options.stream=false]                        Stream the file
     * @return  {Promise<string>}                                             File content
     *
     * @example
     * var files = new Kinvey.Files();
     * files.download('Kinvey.png', {
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
      var _ref2 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee2(name) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var file;
        return _regeneratorRuntime2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                options.query = options.query || {};
                options.query.tls = options.tls === true;

                if ((0, _isNumber2.default)(options.ttl)) {
                  options.query.ttl_in_seconds = options.ttl;
                }

                _context2.next = 5;
                return _get(FileStore.prototype.__proto__ || Object.getPrototypeOf(FileStore.prototype), 'findById', this).call(this, name, options).toPromise();

              case 5:
                file = _context2.sent;

                if (!(options.stream === true)) {
                  _context2.next = 8;
                  break;
                }

                return _context2.abrupt('return', file);

              case 8:

                options.mimeType = file.mimeType;
                return _context2.abrupt('return', this.downloadByUrl(file._downloadURL, options));

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function download(_x4, _x5) {
        return _ref2.apply(this, arguments);
      }

      return download;
    }()

    /**
     * Download a file using a url.
     *
     * @param   {string}        url                                           File download url
     * @param   {Object}        [options]                                     Options
     * @return  {Promise<string>}                                             File content.
    */

  }, {
    key: 'downloadByUrl',
    value: function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee3(url) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var request, response;
        return _regeneratorRuntime2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                request = new _request.NetworkRequest({
                  method: _request.RequestMethod.GET,
                  url: url,
                  timeout: options.timeout
                });
                _context3.next = 3;
                return request.execute();

              case 3:
                response = _context3.sent;
                return _context3.abrupt('return', response.data);

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function downloadByUrl(_x7, _x8) {
        return _ref3.apply(this, arguments);
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

    /**
     * Upload a file.
     *
     * @param {Blob|string} file  File content
     * @param {Object} [metadata={}] File metadata
     * @param {Object} [options={}] Options
     * @return {Promise<File>} A file entity.
     */

  }, {
    key: 'upload',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee4(file) {
        var metadata = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var request, response, data, uploadUrl, headers, statusCheckRequest, statusCheckResponse;
        return _regeneratorRuntime2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                // Set defaults for metadata
                metadata = (0, _assign2.default)({
                  filename: file._filename || file.name,
                  public: false,
                  size: file.size || file.length,
                  mimeType: file.mimeType || file.type || 'application/octet-stream'
                }, metadata);
                metadata._filename = metadata.filename;
                delete metadata.filename;
                metadata._public = metadata.public;
                delete metadata.public;

                // Create the file on Kinvey
                request = new _request.KinveyRequest({
                  method: _request.RequestMethod.POST,
                  authType: _request.AuthType.Default,
                  url: _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname
                  }),
                  properties: options.properties,
                  timeout: options.timeout,
                  body: metadata,
                  client: this.client
                });

                request.headers.set('X-Kinvey-Content-Type', metadata.mimeType);

                // If the file metadata contains an _id then
                // update the file
                if (metadata[idAttribute]) {
                  request.method = _request.RequestMethod.PUT;
                  request.url = _url2.default.format({
                    protocol: this.client.protocol,
                    host: this.client.host,
                    pathname: this.pathname + '/' + metadata._id,
                    query: options.query
                  });
                }

                // Execute the request
                _context4.next = 10;
                return request.execute();

              case 10:
                response = _context4.sent;
                data = response.data;
                uploadUrl = data._uploadURL;
                headers = new _request.Headers(data._requiredHeaders);

                headers.set('content-type', metadata.mimeType);

                // Delete fields from the response
                delete data._expiresAt;
                delete data._requiredHeaders;
                delete data._uploadURL;

                // Execute the status check request
                statusCheckRequest = new _request.NetworkRequest({
                  method: _request.RequestMethod.PUT,
                  url: uploadUrl,
                  timeout: options.timeout
                });

                statusCheckRequest.headers.addAll(headers.toPlainObject());
                statusCheckRequest.headers.set('Content-Length', '0');
                statusCheckRequest.headers.set('Content-Range', 'bytes */' + metadata.size);
                _context4.next = 24;
                return statusCheckRequest.execute(true);

              case 24:
                statusCheckResponse = _context4.sent;


                _utils.Log.debug('File upload status check response', statusCheckResponse);

                // Upload the file

                if (!(statusCheckResponse.isSuccess() === false)) {
                  _context4.next = 34;
                  break;
                }

                if (!(statusCheckResponse.statusCode === _request.StatusCode.ResumeIncomplete)) {
                  _context4.next = 33;
                  break;
                }

                options.start = getStartIndex(statusCheckResponse.headers.get('range'), metadata.size);
                _context4.next = 31;
                return this.uploadToGCS(uploadUrl, headers, file, metadata, options);

              case 31:
                _context4.next = 34;
                break;

              case 33:
                throw statusCheckResponse.error;

              case 34:

                data._data = file;
                return _context4.abrupt('return', data);

              case 36:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function upload(_x11, _x12, _x13) {
        return _ref4.apply(this, arguments);
      }

      return upload;
    }()

    /**
     * @private
     */

  }, {
    key: 'uploadToGCS',
    value: function () {
      var _ref5 = _asyncToGenerator(_regeneratorRuntime2.default.mark(function _callee5(uploadUrl, headers, file, metadata) {
        var _this3 = this;

        var options = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

        var fileSlice, fileSliceSize, request, response, _ret;

        return _regeneratorRuntime2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                // Set default options
                options = (0, _assign2.default)({
                  count: 0,
                  start: 0,
                  maxBackoff: MAX_BACKOFF
                }, options);

                _utils.Log.debug('Start file upload');
                _utils.Log.debug('File upload upload url', uploadUrl);
                _utils.Log.debug('File upload headers', headers.toPlainObject());
                _utils.Log.debug('File upload file', file);
                _utils.Log.debug('File upload metadata', metadata);
                _utils.Log.debug('File upload options', options);

                // Get slice of file to upload
                fileSlice = (0, _isFunction2.default)(file.slice) ? file.slice(options.start) : file;
                fileSliceSize = fileSlice.size || fileSlice.length;

                // Execute the file upload request

                request = new _request.NetworkRequest({
                  method: _request.RequestMethod.PUT,
                  url: uploadUrl,
                  body: fileSlice,
                  timeout: options.timeout
                });

                request.headers.addAll(headers.toPlainObject());
                request.headers.set('content-length', fileSliceSize);
                request.headers.set('content-range', 'bytes ' + options.start + '-' + (metadata.size - 1) + '/' + metadata.size);
                _context5.next = 15;
                return request.execute(true);

              case 15:
                response = _context5.sent;


                _utils.Log.debug('File upload response', response);

                // If the request was not successful uploading the file
                // then check if we should try uploading the remaining
                // portion of the file

                if (!(response.isSuccess() === false)) {
                  _context5.next = 29;
                  break;
                }

                if (!(response.statusCode === _request.StatusCode.ResumeIncomplete)) {
                  _context5.next = 24;
                  break;
                }

                _utils.Log.debug('File upload was incomplete. Trying to upload the remaining protion of the file.');

                options.start = getStartIndex(response.headers.get('range'), metadata.size);
                return _context5.abrupt('return', this.uploadToGCS(uploadUrl, headers, file, metadata, options));

              case 24:
                if (!(response.statusCode >= 500 && response.statusCode < 600)) {
                  _context5.next = 28;
                  break;
                }

                _ret = function () {
                  _utils.Log.debug('File upload error.', response.statusCode);

                  // Calculate the exponential backoff
                  var backoff = Math.pow(2, options.count) + randomInt(1000, 1);

                  // Throw the error if we have excedded the max backoff
                  if (backoff >= options.maxBackoff) {
                    throw response.error;
                  }

                  _utils.Log.debug('File upload will try again in ' + backoff + ' seconds.');

                  // Upload the remaining protion of the file after the backoff time has passed
                  return {
                    v: new _pinkie2.default(function (resolve) {
                      setTimeout(function () {
                        options.count += 1;
                        resolve(_this3.uploadToGCS(uploadUrl, headers, file, metadata, options));
                      }, backoff);
                    })
                  };
                }();

                if (!((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object")) {
                  _context5.next = 28;
                  break;
                }

                return _context5.abrupt('return', _ret.v);

              case 28:
                throw response.error;

              case 29:
                return _context5.abrupt('return', response);

              case 30:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function uploadToGCS(_x16, _x17, _x18, _x19, _x20) {
        return _ref5.apply(this, arguments);
      }

      return uploadToGCS;
    }()

    /**
     * @private
     */

  }, {
    key: 'create',
    value: function create(file, metadata, options) {
      return this.upload(file, metadata, options);
    }

    /**
     * @private
     */

  }, {
    key: 'update',
    value: function update(file, metadata, options) {
      return this.upload(file, metadata, options);
    }

    /**
     * @private
     */

  }, {
    key: 'remove',
    value: function remove() {
      throw new _errors.KinveyError('Please use removeById() to remove files one by one.');
    }
  }, {
    key: 'pathname',

    /**
     * @private
     * The pathname for the store.
     *
     * @return  {string}  Pathname
     */
    get: function get() {
      return '/' + filesNamespace + '/' + this.client.appKey;
    }
  }]);

  return FileStore;
}(_networkstore.NetworkStore);