'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _request = require('../../request');

var _errors = require('../../errors');

var _networkstore = require('./networkstore');

var _networkstore2 = _interopRequireDefault(_networkstore);

var _utils = require('../../utils');

var _es6Promise = require('es6-promise');

var _es6Promise2 = _interopRequireDefault(_es6Promise);

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var filesNamespace = process && process.env && process.env.KINVEY_FILES_NAMESPACE || undefined || 'blob';
var MAX_BACKOFF = process && process.env && process.env.KINVEY_MAX_BACKOFF || undefined || 32 * 1000;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getStartIndex(rangeHeader, max) {
  var start = rangeHeader ? parseInt(rangeHeader.split('-')[1], 10) + 1 : 0;
  return start >= max ? max - 1 : start;
}

var FileStore = function (_NetworkStore) {
  _inherits(FileStore, _NetworkStore);

  function FileStore() {
    _classCallCheck(this, FileStore);

    return _possibleConstructorReturn(this, (FileStore.__proto__ || Object.getPrototypeOf(FileStore)).apply(this, arguments));
  }

  _createClass(FileStore, [{
    key: 'find',
    value: function find(query) {
      var _this2 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options.query = options.query || {};
      options.query.tls = options.tls === true;

      if ((0, _isNumber2.default)(options.ttl)) {
        options.query.ttl_in_seconds = options.ttl;
      }

      return _get(FileStore.prototype.__proto__ || Object.getPrototypeOf(FileStore.prototype), 'find', this).call(this, query, options).toPromise().then(function (files) {
        if (options.download === true) {
          return _es6Promise2.default.all((0, _map2.default)(files, function (file) {
            return _this2.downloadByUrl(file._downloadURL, options);
          }));
        }

        return files;
      });
    }
  }, {
    key: 'findById',
    value: function findById(id, options) {
      return this.download(id, options);
    }
  }, {
    key: 'download',
    value: function download(name) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options.query = options.query || {};
      options.query.tls = options.tls === true;

      if ((0, _isNumber2.default)(options.ttl)) {
        options.query.ttl_in_seconds = options.ttl;
      }

      return _get(FileStore.prototype.__proto__ || Object.getPrototypeOf(FileStore.prototype), 'findById', this).call(this, name, options).toPromise().then(function (file) {
        if (options.stream === true) {
          return file;
        }

        options.mimeType = file.mimeType;
        return _this3.downloadByUrl(file._downloadURL, options);
      });
    }
  }, {
    key: 'downloadByUrl',
    value: function downloadByUrl(url) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var request = new _request.NetworkRequest({
        method: _request.RequestMethod.GET,
        url: url,
        timeout: options.timeout
      });
      return request.execute().then(function (response) {
        return response.data;
      });
    }
  }, {
    key: 'stream',
    value: function stream(name) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options.stream = true;
      return this.download(name, options);
    }
  }, {
    key: 'upload',
    value: function upload(file) {
      var _this4 = this;

      var metadata = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

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

      var request = new _request.KinveyRequest({
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

      if (metadata._id) {
        request.method = _request.RequestMethod.PUT;
        request.url = _url2.default.format({
          protocol: this.client.protocol,
          host: this.client.host,
          pathname: this.pathname + '/' + metadata._id,
          query: options.query
        });
      }

      return request.execute().then(function (response) {
        return response.data;
      }).then(function (data) {
        var uploadUrl = data._uploadURL;
        var headers = new _request.Headers(data._requiredHeaders);
        headers.set('content-type', metadata.mimeType);

        delete data._expiresAt;
        delete data._requiredHeaders;
        delete data._uploadURL;

        var statusCheckRequest = new _request.NetworkRequest({
          method: _request.RequestMethod.PUT,
          url: uploadUrl,
          timeout: options.timeout
        });
        statusCheckRequest.headers.addAll(headers.toPlainObject());
        statusCheckRequest.headers.set('Content-Length', '0');
        statusCheckRequest.headers.set('Content-Range', 'bytes */' + metadata.size);
        return statusCheckRequest.execute(true).then(function (statusCheckResponse) {
          _utils.Log.debug('File upload status check response', statusCheckResponse);

          if (statusCheckResponse.isSuccess() === false) {
            if (statusCheckResponse.statusCode !== _request.StatusCode.ResumeIncomplete) {
              throw statusCheckResponse.error;
            }

            options.start = getStartIndex(statusCheckResponse.headers.get('range'), metadata.size);
            return _this4.uploadToGCS(uploadUrl, headers, file, metadata, options);
          }

          return file;
        }).then(function (file) {
          data._data = file;
          return data;
        });
      });
    }
  }, {
    key: 'uploadToGCS',
    value: function uploadToGCS(uploadUrl, headers, file, metadata) {
      var _this5 = this;

      var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

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

      var fileSlice = (0, _isFunction2.default)(file.slice) ? file.slice(options.start) : file;
      var fileSliceSize = fileSlice.size || fileSlice.length;

      var request = new _request.NetworkRequest({
        method: _request.RequestMethod.PUT,
        url: uploadUrl,
        body: fileSlice,
        timeout: options.timeout
      });
      request.headers.addAll(headers.toPlainObject());
      request.headers.set('Content-Length', fileSliceSize);
      request.headers.set('Content-Range', 'bytes ' + options.start + '-' + (metadata.size - 1) + '/' + metadata.size);
      return request.execute(true).then(function (response) {
        _utils.Log.debug('File upload response', response);

        if (response.isSuccess() === false) {
          if (response.statusCode === _request.StatusCode.ResumeIncomplete) {
            _utils.Log.debug('File upload was incomplete. Trying to upload the remaining protion of the file.');
            options.start = getStartIndex(response.headers.get('range'), metadata.size);
            return _this5.uploadToGCS(uploadUrl, headers, file, metadata, options);
          } else if (response.statusCode >= 500 && response.statusCode < 600) {
            var _ret = function () {
              _utils.Log.debug('File upload error.', response.statusCode);

              var backoff = Math.pow(2, options.count) + randomInt(1000, 1);

              if (backoff >= options.maxBackoff) {
                throw response.error;
              }

              _utils.Log.debug('File upload will try again in ' + backoff + ' seconds.');

              return {
                v: new _es6Promise2.default(function (resolve) {
                  setTimeout(function () {
                    options.count += 1;
                    resolve(_this5.uploadToGCS(uploadUrl, headers, file, metadata, options));
                  }, backoff);
                })
              };
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
          }

          throw response.error;
        }

        return file;
      });
    }
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
    key: 'remove',
    value: function remove() {
      throw new _errors.KinveyError('Please use removeById() to remove files one by one.');
    }
  }, {
    key: 'pathname',
    get: function get() {
      return '/' + filesNamespace + '/' + this.client.appKey;
    }
  }]);

  return FileStore;
}(_networkstore2.default);

exports.default = FileStore;