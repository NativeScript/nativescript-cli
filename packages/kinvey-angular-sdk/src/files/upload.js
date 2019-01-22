"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = upload;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _utils = require("../http/utils");

var _request = require("../http/request");

var _auth = require("../http/auth");

var _headers = require("../http/headers");

var _config = require("../kinvey/config");

var _kinvey = _interopRequireDefault(require("../errors/kinvey"));

var NAMESPACE = 'blob';
var MAX_BACKOFF = 32 * 1000;

function transformMetadata() {
  var file = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var metadata = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var fileMetadata = Object.assign({}, {
    filename: file._filename || file.name,
    public: false,
    size: file.size || file.length,
    mimeType: file.mimeType || file.type || 'application/octet-stream'
  }, metadata);
  fileMetadata._filename = metadata.filename;
  delete fileMetadata.filename;
  fileMetadata._public = metadata.public;
  delete fileMetadata.public;
  return fileMetadata;
}

function saveFileMetadata(_x) {
  return _saveFileMetadata.apply(this, arguments);
}

function _saveFileMetadata() {
  _saveFileMetadata = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(metadata) {
    var options,
        _getConfig,
        apiProtocol,
        apiHost,
        appKey,
        request,
        response,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
            _getConfig = (0, _config.get)(), apiProtocol = _getConfig.apiProtocol, apiHost = _getConfig.apiHost, appKey = _getConfig.appKey;

            if (!(metadata.size <= 0)) {
              _context.next = 4;
              break;
            }

            throw new _kinvey.default('Unable to create a file with a size of 0.');

          case 4:
            request = new _request.KinveyRequest({
              method: metadata._id ? _request.RequestMethod.PUT : _request.RequestMethod.POST,
              headers: {
                'X-Kinvey-Content-Type': metadata.mimeType
              },
              auth: _auth.Auth.Default,
              url: metadata._id ? (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(NAMESPACE, "/").concat(appKey, "/").concat(metadata._id)) : (0, _utils.formatKinveyUrl)(apiProtocol, apiHost, "/".concat(NAMESPACE, "/").concat(appKey)),
              body: metadata,
              timeout: options.timeout
            });
            _context.next = 7;
            return request.execute();

          case 7:
            response = _context.sent;
            return _context.abrupt("return", response.data);

          case 9:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _saveFileMetadata.apply(this, arguments);
}

function checkUploadStatus(url, headers, metadata, timeout) {
  var requestHeaders = new _headers.Headers(headers);
  requestHeaders.set('Content-Type', metadata.mimeType);
  requestHeaders.set('Content-Range', "bytes */".concat(metadata.size));
  var request = new _request.Request({
    method: _request.RequestMethod.PUT,
    headers: requestHeaders,
    url: url,
    timeout: timeout
  });
  return request.execute();
}

function getStartIndex(rangeHeader, max) {
  var start = rangeHeader ? parseInt(rangeHeader.split('-')[1], 10) + 1 : 0;
  return start >= max ? max - 1 : start;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function uploadFile(_x2, _x3, _x4) {
  return _uploadFile.apply(this, arguments);
}

function _uploadFile() {
  _uploadFile = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(url, file, metadata) {
    var options,
        _options$count,
        count,
        _options$maxBackoff,
        maxBackoff,
        _options$start,
        start,
        requestHeaders,
        request,
        response,
        backoff,
        _args2 = arguments;

    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            options = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : {};
            _options$count = options.count, count = _options$count === void 0 ? 0 : _options$count, _options$maxBackoff = options.maxBackoff, maxBackoff = _options$maxBackoff === void 0 ? MAX_BACKOFF : _options$maxBackoff;
            _options$start = options.start, start = _options$start === void 0 ? 0 : _options$start;
            requestHeaders = new _headers.Headers(options.headers);
            requestHeaders.set('Content-Type', metadata.mimeType);
            requestHeaders.set('Content-Range', "bytes ".concat(options.start, "-").concat(metadata.size - 1, "/").concat(metadata.size));
            request = new _request.Request({
              method: _request.RequestMethod.PUT,
              headers: requestHeaders,
              url: url,
              body: file.slice(options.start, metadata.size),
              timeout: options.timeout
            });
            _context2.next = 9;
            return request.execute();

          case 9:
            response = _context2.sent;

            if (response.isSuccess()) {
              _context2.next = 18;
              break;
            }

            if (!(response.statusCode >= 500 && response.statusCode < 600)) {
              _context2.next = 17;
              break;
            }

            backoff = Math.pow(2, options.count) + randomInt(1, 1001); // Calculate the exponential backoff

            if (!(backoff < options.maxBackoff)) {
              _context2.next = 17;
              break;
            }

            _context2.next = 16;
            return new Promise(function (resolve) {
              setTimeout(resolve, backoff);
            });

          case 16:
            return _context2.abrupt("return", uploadFile(url, file, metadata, {
              count: count + 1,
              start: start,
              maxBackoff: maxBackoff
            }));

          case 17:
            throw response.error;

          case 18:
            if (!(response.statusCode === 308)) {
              _context2.next = 21;
              break;
            }

            start = getStartIndex(response.headers.get('Range'), metadata.size);
            return _context2.abrupt("return", uploadFile(url, file, metadata, {
              count: 0,
              start: start,
              maxBackoff: maxBackoff
            }));

          case 21:
            return _context2.abrupt("return", response.data);

          case 22:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _uploadFile.apply(this, arguments);
}

function upload() {
  return _upload.apply(this, arguments);
}

function _upload() {
  _upload = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3() {
    var file,
        metadata,
        options,
        fileMetadata,
        kinveyFile,
        uploadStatusResponse,
        uploadOptions,
        _args3 = arguments;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            file = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : {};
            metadata = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : {};
            options = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : {};
            fileMetadata = transformMetadata(file, metadata);
            _context3.next = 6;
            return saveFileMetadata(fileMetadata, options);

          case 6:
            kinveyFile = _context3.sent;
            _context3.next = 9;
            return checkUploadStatus(kinveyFile._uploadURL, kinveyFile._requiredHeaders, fileMetadata, options.timeout);

          case 9:
            uploadStatusResponse = _context3.sent;

            if (uploadStatusResponse.isSuccess()) {
              _context3.next = 12;
              break;
            }

            throw uploadStatusResponse.error;

          case 12:
            if (!(uploadStatusResponse.statusCode !== 200 && uploadStatusResponse.statusCode !== 201)) {
              _context3.next = 18;
              break;
            }

            if (!(uploadStatusResponse.statusCode !== 308)) {
              _context3.next = 15;
              break;
            }

            throw new _kinvey.default('Unexpected response for upload file status check request.');

          case 15:
            uploadOptions = {
              start: getStartIndex(uploadStatusResponse.headers.get('Range'), metadata.size),
              timeout: options.timeout,
              maxBackoff: options.maxBackoff,
              headers: kinveyFile._requiredHeaders
            };
            _context3.next = 18;
            return uploadFile(kinveyFile._uploadURL, file, fileMetadata, uploadOptions);

          case 18:
            delete kinveyFile._expiresAt;
            delete kinveyFile._requiredHeaders;
            delete kinveyFile._uploadURL;
            kinveyFile._data = file;
            return _context3.abrupt("return", kinveyFile);

          case 23:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _upload.apply(this, arguments);
}