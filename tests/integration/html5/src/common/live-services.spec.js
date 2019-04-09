"use strict";

require("core-js/modules/es.array.index-of");

require("core-js/modules/es.object.assign");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/web.timers");

var _chai = require("chai");

var _lodash = _interopRequireDefault(require("lodash"));

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var utilities = _interopRequireWildcard(require("../utils"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var createdUserIds = [];
var collectionName = process.env.COLLECTION_NAME;
var networkStore;
var appCredentials;

var checkLocalStorageForSubscriptionKey = function checkLocalStorageForSubscriptionKey() {
  var hasSubscriptionKey = false;

  for (var key in localStorage) {
    if (key.indexOf('sub') !== -1) {
      hasSubscriptionKey = true;
    }
  }

  return hasSubscriptionKey;
};

describe.skip('Live-services', function () {
  networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
  var messageCreated;
  var messageUpdated;
  var entity1 = utilities.getEntity(utilities.randomString());
  var entity2 = utilities.getEntity(utilities.randomString());
  var entity3 = utilities.getEntity(utilities.randomString());
  before(function () {
    appCredentials = Kinvey.init({
      appKey: process.env.APP_KEY,
      appSecret: process.env.APP_SECRET,
      masterSecret: process.env.MASTER_SECRET
    });
  });
  before(function (done) {
    utilities.cleanUpAppData(collectionName, createdUserIds).then(function () {
      return Kinvey.User.signup();
    }).then(function (user) {
      createdUserIds.push(user.data._id);
      done();
    })["catch"](done);
  });
  before(function (done) {
    networkStore.save(entity1).then(function () {
      networkStore.save(entity2).then(function () {
        done();
      });
    })["catch"](done);
  });
  afterEach(function (done) {
    var activeUser = Kinvey.User.getActiveUser();

    if (activeUser) {
      activeUser.unregisterFromLiveService().then(function () {
        //expect(checkLocalStorageForSubscriptionKey()).to.equal(false);
        done();
      })["catch"](done);
    }
  });
  it('should register user for live services', function (done) {
    var activeUser = Kinvey.User.getActiveUser();
    activeUser.registerForLiveService().then(function (res) {
      (0, _chai.expect)(res).to.equal(true);
      (0, _chai.expect)(checkLocalStorageForSubscriptionKey()).to.equal(true);
      done();
    })["catch"](done);
  });
  it('should subscribe user and receive messages for created items', function (done) {
    var activeUser = Kinvey.User.getActiveUser();
    activeUser.registerForLiveService().then(function (res) {
      (0, _chai.expect)(res).to.equal(true);
      (0, _chai.expect)(checkLocalStorageForSubscriptionKey()).to.equal(true);
      networkStore.subscribe({
        onMessage: function onMessage(m) {
          messageCreated = m;
        },
        onStatus: function onStatus(s) {
          throw new Error('This should not happen');
        },
        onError: function onError(e) {
          throw new Error(err);
        }
      }).then(function () {
        networkStore.save(entity3).then(function (res) {
          setTimeout(function () {
            (0, _chai.expect)(utilities.deleteEntityMetadata(messageCreated)).to.deep.equal(entity3);
            done();
          }, 4000);
        })["catch"](done);
      })["catch"](done);
    })["catch"](done);
  });
  it('should subscribe user and receive messages for updated items', function (done) {
    var updatedEntity = Object.assign({}, entity1);
    updatedEntity.textField = 'updatedField';
    var activeUser = Kinvey.User.getActiveUser();
    activeUser.registerForLiveService().then(function (res) {
      (0, _chai.expect)(res).to.equal(true);
      (0, _chai.expect)(checkLocalStorageForSubscriptionKey()).to.equal(true);
      networkStore.subscribe({
        onMessage: function onMessage(m) {
          messageUpdated = m;
        },
        onStatus: function onStatus(s) {
          throw new Error('This should not happen');
        },
        onError: function onError(e) {
          throw new Error(err);
        }
      }).then(function () {
        networkStore.save(updatedEntity).then(function () {
          setTimeout(function () {
            (0, _chai.expect)(utilities.deleteEntityMetadata(messageUpdated)).to.deep.equal(updatedEntity);
            done();
          }, 4000);
        })["catch"](done);
      })["catch"](done);
    })["catch"](done);
  });
});