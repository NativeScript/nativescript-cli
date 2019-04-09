"use strict";

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

var _chai = require("chai");

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var config = _interopRequireWildcard(require("../config"));

var utilities = _interopRequireWildcard(require("../utils"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

describe('Endpoint', function () {
  var createdUserIds = [];
  before(function () {
    return Kinvey.init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });
  before(function (done) {
    Kinvey.User.signup().then(function (user) {
      createdUserIds.push(user.data._id);
      done();
    })["catch"](done);
  });
  after(function (done) {
    utilities.cleanUpAppData(config.collectionName, createdUserIds).then(function () {
      return done();
    })["catch"](done);
  });
  it('should invoke an endpoint and return the result', function () {
    return Kinvey.CustomEndpoint.execute('testEndpoint').then(function (res) {
      (0, _chai.expect)(res).to.deep.equal({
        property1: 'value1',
        property2: 'value2'
      });
    });
  });
  it('should send body properties and return the result', function () {
    var argsValue = {
      property1: 'sentProperty1',
      property2: 'sentProperty2'
    };
    return Kinvey.CustomEndpoint.execute('testEndpointReturnsArgs', argsValue).then(function (res) {
      (0, _chai.expect)(res).to.deep.equal(argsValue);
    });
  });
  it('should throw error for non-existing endpoint', function () {
    return Kinvey.CustomEndpoint.execute('noEndpoint').then(function () {
      Promise.reject(new Error('This should not happen.'));
    })["catch"](function (err) {
      (0, _chai.expect)(err.message).to.equal('The custom endpoint you tried to access does not exist. Please configure custom Business Logic endpoints through the Kinvey Console.');
    });
  }); // Skipped until MLIBZ-2844

  it.skip('should throw error for non-object args parameter', function () {
    return Kinvey.CustomEndpoint.execute('testEndpoint', 'stringValue').then(function () {
      Promise.reject(new Error('This should not happen.'));
    })["catch"](function (err) {
      (0, _chai.expect)(err.message).to.equal('Custom endpoint parameters can only be of type object');
    });
  });
});