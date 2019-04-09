"use strict";

require("core-js/modules/es.array.find");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.array.join");

require("core-js/modules/es.array.map");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.string.iterator");

require("core-js/modules/web.dom-collections.iterator");

require("core-js/modules/web.timers");

require("regenerator-runtime/runtime");

var _chai = require("chai");

var _lodash = _interopRequireDefault(require("lodash"));

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var utilities = _interopRequireWildcard(require("../utils"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var appCredentials;
describe('Files', function () {
  before(function () {
    appCredentials = Kinvey.init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });
  before(function () {
    utilities.cleanUpCollection(appCredentials, '_blob');
  });
  before(
  /*#__PURE__*/
  _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", Kinvey.User.signup({
              username: utilities.randomString(),
              password: utilities.randomString()
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  })));
  after(function () {
    var activeUser = Kinvey.User.getActiveUser();
    return Kinvey.User.remove(activeUser._id, {
      hard: true
    });
  });
  describe('find()', function () {
    var uploadedFile;
    before(
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2() {
      var testFile, filename, mimeType, size;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              testFile = utilities.randomString();
              filename = "".concat(utilities.randomString(), ".txt");
              mimeType = 'text/plain';
              size = testFile.length;
              _context2.next = 6;
              return Kinvey.Files.upload(testFile, {
                filename: filename,
                mimeType: mimeType,
                size: size
              });

            case 6:
              uploadedFile = _context2.sent;

            case 7:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    })));
    after(
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee3() {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return Kinvey.Files.removeById(uploadedFile._id);

            case 2:
              uploadedFile = undefined;

            case 3:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    })));
    it('should find the files',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee4() {
      var files, file;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return Kinvey.Files.find();

            case 2:
              files = _context4.sent;
              (0, _chai.expect)(files.length).to.equal(1);
              file = files[0];
              (0, _chai.expect)(file._id).to.equal(uploadedFile._id);
              (0, _chai.expect)(file._filename).to.equal(uploadedFile._filename);
              (0, _chai.expect)(file.mimeType).to.equal(uploadedFile.mimeType);
              (0, _chai.expect)(file.size).to.equal(uploadedFile.size);
              (0, _chai.expect)(file._downloadURL).to.exist;

            case 10:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    })));
  });
  describe('upload()', function () {
    it('should upload a file',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee5() {
      var testFile, filename, mimeType, size, file;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              testFile = utilities.randomString();
              filename = "".concat(utilities.randomString(), ".txt");
              mimeType = 'text/plain';
              size = testFile.length; // Upload the file

              _context5.next = 6;
              return Kinvey.Files.upload(testFile, {
                "public": true,
                filename: filename,
                mimeType: mimeType,
                size: size
              });

            case 6:
              file = _context5.sent;
              // Expectations
              (0, _chai.expect)(file._id).to.not.be.undefined;
              (0, _chai.expect)(file._filename).to.equal(filename);
              (0, _chai.expect)(file.mimeType).to.equal(mimeType);
              (0, _chai.expect)(file.size).to.equal(size); // Remove the file

              _context5.next = 13;
              return Kinvey.Files.removeById(file._id);

            case 13:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5);
    })));
  });
  var notFoundErrorName = 'NotFoundError';
  var notFoundErrorMessage = 'This blob not found for this app backend.';
  var plainTextMimeType = 'text/plain';
  var octetStreamMimeType = 'application/octet-stream';
  var shouldNotBeCalledMessage = 'Should not be called';

  var uploadFiles = function uploadFiles(files) {
    return Promise.all(files.map(function (file) {
      return Kinvey.Files.upload(file, {
        mimeType: plainTextMimeType
      });
    }));
  };

  describe('Files Common tests', function () {
    var fileToUpload1;
    var fileToUpload2; // The string content should match the content of the used sample files test1.txt and test2.txt in test/integration/sample-test-files

    var fileContent1 = 'some_text1';
    var fileContent2 = 'some_text2';
    before(function (done) {
      Kinvey.User.logout().then(function () {
        return Kinvey.User.signup();
      }).then(function () {
        // Check if the runtime is {N} and set fileToUpload to file path, as Files.upload() works by file path in {N}
        // Files.upload() itself is tested per shim in other suites
        try {
          var fs = require('tns-core-modules/file-system');

          var sampleTestFilesPath = fs.path.join(fs.knownFolders.currentApp().path, 'sample-test-files');
          fileToUpload1 = fs.path.join(sampleTestFilesPath, 'test1.txt');
          fileToUpload2 = fs.path.join(sampleTestFilesPath, 'test2.txt');
        } catch (error) {
          //expect(error instanceof ReferenceError).to.be.true; //TODO error is not an instance of referenceError
          fileToUpload1 = fileContent1;
          fileToUpload2 = fileContent2;
        }

        ;
        done();
      })["catch"](done);
    });
    describe('Read Operations', function () {
      var uploadedFile1;
      var uploadedFile2;
      var query;
      var file1Metadata;
      var file2Metadata;
      before(function (done) {
        uploadFiles([fileToUpload1, fileToUpload2]).then(function (result) {
          uploadedFile1 = result.find(function (result) {
            return result._data === fileToUpload1;
          });
          uploadedFile2 = result.find(function (result) {
            return result._data === fileToUpload2;
          });
          var fileBasicProperties = ['_id', '_filename', 'mimeType'];
          file1Metadata = _lodash["default"].pick(uploadedFile1, fileBasicProperties);
          file2Metadata = _lodash["default"].pick(uploadedFile2, fileBasicProperties);
          query = new Kinvey.Query();
          query.equalTo('_filename', uploadedFile2._filename);
          done();
        })["catch"](done);
      });
      describe('find()', function () {
        it('should return the metadata of all files by https', function (done) {
          Kinvey.Files.find().then(function (result) {
            (0, _chai.expect)(result).to.be.an('array');
            (0, _chai.expect)(result.length).to.equal(2);
            var file1 = result.find(function (file) {
              return file._id === uploadedFile1._id;
            });
            var file2 = result.find(function (file) {
              return file._id === uploadedFile2._id;
            });
            utilities.assertReadFileResult(file1, file1Metadata);
            utilities.assertReadFileResult(file2, file2Metadata);
            done();
          })["catch"](done);
        });
        it('should return the metadata for all files that match the query', function (done) {
          Kinvey.Files.find(query).then(function (result) {
            (0, _chai.expect)(result).to.be.an('array');
            (0, _chai.expect)(result.length).to.equal(1);
            utilities.assertReadFileResult(result[0], file2Metadata);
            done();
          })["catch"](done);
        });
        it('should return the file by http if tls = false', function (done) {
          Kinvey.Files.find(query, {
            tls: false
          }).then(function (result) {
            utilities.assertReadFileResult(result[0], file2Metadata, true);
            done();
          })["catch"](done);
        });
        it('should set correctly ttl', function (done) {
          var ttlValue = 1;
          Kinvey.Files.find(query, {
            ttl: ttlValue
          }).then(function (result) {
            utilities.assertReadFileResult(result[0], file2Metadata);
            setTimeout(function () {
              return Kinvey.Files.downloadByUrl(result[0]._downloadURL).then(function () {
                done(new Error(shouldNotBeCalledMessage));
              })["catch"](function (error) {
                (0, _chai.expect)(error).to.exist; // utilities.assertError(error, 'KinveyError', 'An error occurred.');

                done();
              })["catch"](done);
            }, ttlValue + 1000);
          })["catch"](done);
        });
        it('should download all files with download = true', function (done) {
          Kinvey.Files.find(null, {
            download: true
          }).then(function (result) {
            (0, _chai.expect)(result).to.be.an('array');
            (0, _chai.expect)(result.length).to.equal(2);
            (0, _chai.expect)(result.find(function (fileContent) {
              return fileContent === fileContent1;
            })).to.exist;
            (0, _chai.expect)(result.find(function (fileContent) {
              return fileContent === fileContent2;
            })).to.exist;
            done();
          })["catch"](done);
        });
        it('should download all files which match the query with download = true', function (done) {
          Kinvey.Files.find(query, {
            download: true
          }).then(function (result) {
            (0, _chai.expect)(result).to.be.an('array');
            (0, _chai.expect)(result.length).to.equal(1);
            (0, _chai.expect)(result[0]).to.equal(fileContent2);
            done();
          })["catch"](done);
        });
      });
      describe('findById()', function () {
        it('should download the file by id', function (done) {
          Kinvey.Files.findById(uploadedFile2._id).then(function (result) {
            (0, _chai.expect)(result).to.equal(fileContent2);
            done();
          })["catch"](done);
        });
        it('should return a NotFoundError if the file with the supplied _id does not exist on the server', function (done) {
          Kinvey.Files.findById(utilities.randomString()).then(function () {
            return done(new Error(shouldNotBeCalledMessage));
          })["catch"](function (error) {
            utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
            done();
          })["catch"](done);
        });
      });
      describe('download()', function () {
        it('should download the file by _id', function (done) {
          Kinvey.Files.download(uploadedFile1._id).then(function (result) {
            (0, _chai.expect)(result).to.exist;
            (0, _chai.expect)(result).to.equal(fileContent1);
            done();
          })["catch"](done);
        });
        it('should stream the file by https with stream = true and not set tls', function (done) {
          Kinvey.Files.download(uploadedFile1._id, {
            stream: true
          }).then(function (result) {
            utilities.assertReadFileResult(result, file1Metadata);
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          }).then(function (result) {
            (0, _chai.expect)(result).to.exist;
            (0, _chai.expect)(result).to.equal(fileContent1);
            done();
          })["catch"](done);
        });
        it('should stream the file by https with stream = true and tls = true', function (done) {
          Kinvey.Files.download(uploadedFile1._id, {
            stream: true,
            tls: true
          }).then(function (result) {
            utilities.assertReadFileResult(result, file1Metadata);
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          }).then(function (result) {
            (0, _chai.expect)(result).to.exist;
            (0, _chai.expect)(result).to.equal(fileContent1);
            done();
          })["catch"](done);
        });
        it('should stream the file by http with stream = true and tls = false', function (done) {
          Kinvey.Files.download(uploadedFile1._id, {
            stream: true,
            tls: false
          }).then(function (result) {
            utilities.assertReadFileResult(result, file1Metadata, true);
            done();
          })["catch"](done);
        });
        it('should not stream the file with stream = false', function (done) {
          Kinvey.Files.download(uploadedFile1._id, {
            stream: false
          }).then(function (result) {
            (0, _chai.expect)(result).to.exist;
            (0, _chai.expect)(result).to.equal(fileContent1);
            done();
          })["catch"](done);
        });
        it('should set correctly ttl', function (done) {
          var ttlValue = 1;
          Kinvey.Files.download(uploadedFile1._id, {
            ttl: ttlValue,
            stream: true
          }).then(function (result) {
            utilities.assertReadFileResult(result, file1Metadata);
            setTimeout(function () {
              // TODO: change error message to 'The provided token has expired.'
              return Kinvey.Files.downloadByUrl(result._downloadURL).then(function () {
                done(new Error(shouldNotBeCalledMessage));
              })["catch"](function (error) {
                (0, _chai.expect)(error).to.exist; // utilities.assertError(error, 'KinveyError', 'An error occurred.');

                done();
              })["catch"](done);
            }, ttlValue + 1000);
          })["catch"](done);
        });
        it('should return and NotFoundError if the file with the supplied _id does not exist on the server', function (done) {
          Kinvey.Files.download(utilities.randomString()).then(function () {
            return done(new Error(shouldNotBeCalledMessage));
          })["catch"](function (error) {
            utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
            done();
          })["catch"](done);
        });
      });
      describe('stream()', function () {
        it('should stream the file by https when tls is not set', function (done) {
          Kinvey.Files.stream(uploadedFile1._id).then(function (result) {
            utilities.assertReadFileResult(result, file1Metadata);
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          }).then(function (result) {
            (0, _chai.expect)(result).to.exist;
            (0, _chai.expect)(result).to.equal(fileContent1);
            done();
          })["catch"](done);
        });
        it('should stream the file by https when tls = true', function (done) {
          Kinvey.Files.stream(uploadedFile1._id, {
            tls: true
          }).then(function (result) {
            utilities.assertReadFileResult(result, file1Metadata);
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          }).then(function (result) {
            (0, _chai.expect)(result).to.exist;
            (0, _chai.expect)(result).to.equal(fileContent1);
            done();
          })["catch"](done);
        });
        it('should stream the file by http when tls = false', function (done) {
          Kinvey.Files.stream(uploadedFile1._id, {
            tls: false
          }).then(function (result) {
            utilities.assertReadFileResult(result, file1Metadata, true);
            done();
          })["catch"](done);
        });
        it('should set correctly ttl', function (done) {
          var ttlValue = 1;
          Kinvey.Files.stream(uploadedFile1._id, {
            ttl: ttlValue
          }).then(function (result) {
            utilities.assertReadFileResult(result, file1Metadata);
            setTimeout(function () {
              // TODO: change error message to 'The provided token has expired.'
              return Kinvey.Files.downloadByUrl(result._downloadURL).then(function () {
                done(new Error(shouldNotBeCalledMessage));
              })["catch"](function (error) {
                (0, _chai.expect)(error).to.exist; // utilities.assertError(error, 'KinveyError', 'An error occurred.');

                done();
              })["catch"](done);
            }, ttlValue + 1000);
          })["catch"](done);
        });
        it('should return a NotFoundError if the file with the supplied _id does not exist on the server', function (done) {
          Kinvey.Files.stream(utilities.randomString()).then(function () {
            return done(new Error(shouldNotBeCalledMessage));
          })["catch"](function (error) {
            utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
            done();
          })["catch"](done);
        });
      });
      describe('downloadByUrl()', function () {
        it('should download the file by _downloadUrl', function (done) {
          Kinvey.Files.stream(uploadedFile1._id).then(function (result) {
            return Kinvey.Files.downloadByUrl(result._downloadURL);
          }).then(function (result) {
            (0, _chai.expect)(result).to.exist;
            (0, _chai.expect)(result).to.equal(fileContent1);
            done();
          })["catch"](done);
        });
        it('should return an error if the url is invalid', function (done) {
          Kinvey.Files.downloadByUrl(utilities.randomString()).then(function () {
            return done(new Error(shouldNotBeCalledMessage));
          })["catch"](function (error) {
            (0, _chai.expect)(error).to.exist;
            done();
          })["catch"](done);
        });
      });
    });
    describe('upload()', function () {
      it("without metadata should upload with mimeType = ".concat(octetStreamMimeType), function (done) {
        utilities.testFileUpload(fileToUpload1, undefined, {
          mimeType: octetStreamMimeType
        }, fileContent1, undefined, done);
      });
      it('should set custom properties, supplied with the metadata', function (done) {
        var metadata = {
          testProperty: 'test'
        };
        utilities.testFileUpload(fileToUpload1, metadata, metadata, fileContent1, undefined, done);
      });
      it('should set _acl', function (done) {
        var randomId = utilities.randomString();
        var acl = new Kinvey.Acl({});
        acl.addReader(randomId);
        var expectedArray = [randomId];
        var expectedMetadata = {};
        expectedMetadata['_acl'] = {};
        expectedMetadata['_acl']['r'] = expectedArray;
        utilities.testFileUpload(fileToUpload1, {
          _acl: acl.toPlainObject()
        }, expectedMetadata, fileContent1, undefined, done);
      });
      it('should upload a publicly-readable file with public = true', function (done) {
        utilities.testFileUpload(fileToUpload1, {
          "public": true
        }, {
          _public: true
        }, fileContent1, undefined, done);
      });
      it('should update the content and the metadata of an existing file', function (done) {
        var query = new Kinvey.Query();
        var updatedmetadata = {
          filename: utilities.randomString(),
          mimeType: plainTextMimeType
        };
        var expectedMetadata = {
          _filename: updatedmetadata.filename,
          mimeType: updatedmetadata.mimeType
        };
        Kinvey.Files.upload(fileToUpload1).then(function (file) {
          updatedmetadata._id = file._id;
          query.equalTo('_id', updatedmetadata._id);
          utilities.testFileUpload(fileToUpload2, updatedmetadata, expectedMetadata, fileContent2, query, done);
        })["catch"](done);
      });
    });
    describe('removeById()', function () {
      var fileToRemoveId;
      var file2Id;
      before(function (done) {
        uploadFiles([fileToUpload1, fileToUpload2]).then(function (result) {
          fileToRemoveId = result.find(function (result) {
            return result._data === fileToUpload1;
          })._id;
          file2Id = result.find(function (result) {
            return result._data === fileToUpload2;
          })._id;
          done();
        })["catch"](done);
      });
      it('should remove the file by _id', function (done) {
        Kinvey.Files.removeById(fileToRemoveId).then(function (result) {
          (0, _chai.expect)(result.count).to.equal(1); // check that the file is removed

          return Kinvey.Files.findById(fileToRemoveId);
        }).then(function () {
          return done(new Error(shouldNotBeCalledMessage));
        })["catch"](function (error) {
          utilities.assertError(error, notFoundErrorName, notFoundErrorMessage); //check that the second file remains

          return Kinvey.Files.findById(file2Id);
        }).then(function (result) {
          (0, _chai.expect)(result).to.equal(fileContent2);
          done();
        })["catch"](done);
      });
      it('should return a NotFoundError if the file with the supplied _id does not exist on the server', function (done) {
        Kinvey.Files.removeById(utilities.randomString()).then(function () {
          return done(new Error(shouldNotBeCalledMessage));
        })["catch"](function (error) {
          utilities.assertError(error, notFoundErrorName, notFoundErrorMessage);
          done();
        })["catch"](done);
      });
    });
  });
});