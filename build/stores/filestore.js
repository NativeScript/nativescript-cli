'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _networkstore = require('./networkstore');

var _network = require('../requests/network');

var _enums = require('../enums');

var _errors = require('../errors');

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var filesNamespace = 'blob' || 'blob';
var idAttribute = '_id' || '_id';

/**
 * The FilesStore class is used to find, save, update, remove, count and group files.
 */

var FileStore = exports.FileStore = function (_NetworkStore) {
  _inherits(FileStore, _NetworkStore);

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
      var _this2 = this;

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
          var promises = (0, _map2.default)(files, function (file) {
            return _this2.downloadByUrl(file._downloadURL, options);
          });
          return _babybird2.default.all(promises);
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
      var _this3 = this;

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

        return _this3.downloadByUrl(file._downloadURL, options);
      });

      return promise;
    }
  }, {
    key: 'downloadByUrl',
    value: function downloadByUrl(url) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = _babybird2.default.resolve().then(function () {
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
      return _babybird2.default.reject(new _errors.KinveyError('Please use `upload()` to save files.'));
    }
  }, {
    key: 'update',
    value: function update() {
      return _babybird2.default.reject(new _errors.KinveyError('Please use `upload()` to update files.'));
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
}(_networkstore.NetworkStore);