"use strict";

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.function.name");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/web.dom-collections.for-each");

var _chai = require("chai");

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var utilities = _interopRequireWildcard(require("../utils"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

describe('Files', function () {
  var stringContent = utilities.randomString();
  var blob = new Blob([stringContent]);
  var file = new File([stringContent], utilities.randomString());
  var fileRepresentations = [stringContent, blob, file]; // const arrayBuffer = utilities.ArrayBufferFromString(stringContent);
  // ArrayBuffer does not work currently - it should be discussed if we support it

  before(function () {
    return Kinvey.init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });
  before(function (done) {
    Kinvey.User.logout().then(function () {
      return Kinvey.User.signup();
    }).then(function () {
      return done();
    })["catch"](done);
  });
  describe('upload()', function () {
    var metadata;
    var expectedMetadata;
    beforeEach(function (done) {
      metadata = utilities.getFileMetadata(utilities.randomString());
      expectedMetadata = utilities.getExpectedFileMetadata(metadata);
      done();
    });
    fileRepresentations.forEach(function (representation) {
      it("should upload a file by ".concat(representation.constructor.name), function (done) {
        utilities.testFileUpload(representation, metadata, expectedMetadata, stringContent, null, done);
      });
    });
    it('should set options.timeout', function (done) {
      Kinvey.Files.upload(stringContent, undefined, {
        timeout: 1
      }).then(function () {
        return done(new Error('Should not be called'));
      })["catch"](function (error) {
        (0, _chai.expect)(error.message).to.contain('request timed out');
        done();
      })["catch"](done);
    });
  });
});