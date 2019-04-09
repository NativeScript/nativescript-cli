"use strict";

require("core-js/modules/es.array.concat");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("regenerator-runtime/runtime");

var _chai = require("chai");

var idb = _interopRequireWildcard(require("idb"));

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var utilities = _interopRequireWildcard(require("../utils"));

var config = _interopRequireWildcard(require("../config"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var createdUserIds = [];
var defaultTimeout = 60000;
var defaultStorage = 'IndexedDB';
var defaultApiProtocol = 'https:';
var defaultApiHost = 'baas.kinvey.com';
var defaultApiHostname = 'https://baas.kinvey.com';
var defaultAuthProtocol = 'https:';
var defaultAuthHost = 'auth.kinvey.com';
var defaultAuthHostname = 'https://auth.kinvey.com';
var defaultMicProtocol = 'https:';
var defaultMicHost = 'auth.kinvey.com';
var defaultMicHostname = 'https://auth.kinvey.com';
var instanceId = 'testinstance';
var encryptionKey = 'key';
var collectionName = config.collectionName;
var testItem = {
  name: 'randomName'
};

var setupOfflineProvider = function setupOfflineProvider(offlineProvider) {
  var init = Kinvey.init({
    appKey: process.env.APP_KEY,
    appSecret: process.env.APP_SECRET,
    storage: offlineProvider
  });
  (0, _chai.expect)(init.storage).to.equal(offlineProvider);
  return Kinvey.User.signup().then(function (user) {
    createdUserIds.push(user.data._id);
  })["catch"](function (err) {
    Promise.reject(err);
  });
};

var checkIndexedDB =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var collection, insertedItem, dbPromise;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            collection = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Cache);
            _context.next = 3;
            return collection.save(testItem);

          case 3:
            insertedItem = _context.sent;
            dbPromise = idb.openDb(process.env.APP_KEY, 3);
            return _context.abrupt("return", dbPromise.then(function (db) {
              var tx = db.transaction(collectionName);
              var store = tx.objectStore(collectionName);
              var res = store.get(insertedItem._id);
              tx.complete;
              return res;
            }).then(function (obj) {
              (0, _chai.expect)(obj).to.deep.equal(insertedItem);
            })["catch"](function (err) {
              return Promise.reject(err);
            }));

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function checkIndexedDB() {
    return _ref.apply(this, arguments);
  };
}();

var checkWebSQL =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    var collection, insertedItem, db;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            collection = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Cache);
            _context2.next = 3;
            return collection.save(testItem);

          case 3:
            insertedItem = _context2.sent;
            db = window.openDatabase(process.env.APP_KEY, 1, collectionName, 20000);
            db.transaction(function (tx) {
              tx.executeSql("SELECT * FROM ".concat(collectionName, " WHERE value LIKE '%").concat(insertedItem._id, "%'"), [], function (tx, resultSet) {
                (0, _chai.expect)(JSON.parse(resultSet.rows[0].value)).to.deep.equal(insertedItem);
              });
            });

          case 6:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function checkWebSQL() {
    return _ref2.apply(this, arguments);
  };
}();

var checkLocalStorage =
/*#__PURE__*/
function () {
  var _ref3 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3() {
    var collection, insertedItem, items;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            collection = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
            _context3.next = 3;
            return collection.save(testItem);

          case 3:
            insertedItem = _context3.sent;
            items = window.localStorage.getItem("".concat(process.env.APP_KEY, ".").concat(collectionName));
            (0, _chai.expect)(JSON.parse(items)[0]).to.deep.equal(insertedItem);

          case 6:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function checkLocalStorage() {
    return _ref3.apply(this, arguments);
  };
}();

var checkSessionStorage =
/*#__PURE__*/
function () {
  var _ref4 = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4() {
    var collection, insertedItem, items;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            collection = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
            _context4.next = 3;
            return collection.save(testItem);

          case 3:
            insertedItem = _context4.sent;
            items = window.sessionStorage.getItem("".concat(process.env.APP_KEY, ".").concat(collectionName));
            (0, _chai.expect)(JSON.parse(items)[0]).to.deep.equal(insertedItem);

          case 6:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function checkSessionStorage() {
    return _ref4.apply(this, arguments);
  };
}();

describe.only('Init tests', function () {
  describe('Init()', function () {
    it('should throw error for missing appKey', function (done) {
      (0, _chai.expect)(function () {
        var init = Kinvey.init({
          appSecret: process.env.APP_SECRET
        });
      }).to["throw"]('An appKey is required and must be a string.');
      done();
    });
    it('should throw error for missing appSecret or masterSecret', function (done) {
      (0, _chai.expect)(function () {
        var init = Kinvey.init({
          appKey: process.env.APP_KEY
        });
      }).to["throw"]('An appSecret is required and must be a string.');
      done();
    });
    it('should initialize the SDK with the default properties', function (done) {
      var init = Kinvey.init({
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET
      });
      (0, _chai.expect)(init.appKey).to.equal(process.env.APP_KEY);
      (0, _chai.expect)(init.appSecret).to.equal(process.env.APP_SECRET);
      (0, _chai.expect)(init.defaultTimeout).to.equal(defaultTimeout); //expect(init.storage).to.equal(defaultStorage);

      (0, _chai.expect)(init.apiProtocol).to.equal(defaultApiProtocol);
      (0, _chai.expect)(init.apiHost).to.equal(defaultApiHost);
      (0, _chai.expect)(init.apiHostname).to.equal(defaultApiHostname);
      (0, _chai.expect)(init.authProtocol).to.equal(defaultAuthProtocol);
      (0, _chai.expect)(init.authHost).to.equal(defaultAuthHost);
      (0, _chai.expect)(init.authHostname).to.equal(defaultAuthHostname);
      (0, _chai.expect)(init.micProtocol).to.equal(defaultMicProtocol);
      (0, _chai.expect)(init.micHost).to.equal(defaultMicHost);
      (0, _chai.expect)(init.micHostname).to.equal(defaultMicHostname);
      done();
    });
    it('should set the optional properties', function (done) {
      var init = Kinvey.init({
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET,
        masterSecret: process.env.MASTER_SECRET,
        instanceId: instanceId,
        appVersion: '2',
        encryptionKey: encryptionKey
      });
      (0, _chai.expect)(init.masterSecret).to.equal(process.env.MASTER_SECRET);
      (0, _chai.expect)(init.apiProtocol).to.equal(defaultApiProtocol);
      (0, _chai.expect)(init.apiHost).to.equal("".concat(instanceId, "-").concat(defaultApiHost));
      (0, _chai.expect)(init.apiHostname).to.equal("".concat(defaultApiProtocol, "//").concat(instanceId, "-").concat(defaultApiHost));
      (0, _chai.expect)(init.authProtocol).to.equal(defaultAuthProtocol);
      (0, _chai.expect)(init.authHost).to.equal("".concat(instanceId, "-").concat(defaultAuthHost));
      (0, _chai.expect)(init.authHostname).to.equal("".concat(defaultAuthProtocol, "//").concat(instanceId, "-").concat(defaultAuthHost));
      (0, _chai.expect)(init.micProtocol).to.equal(defaultMicProtocol);
      (0, _chai.expect)(init.micHost).to.equal("".concat(instanceId, "-").concat(defaultMicHost));
      (0, _chai.expect)(init.micHostname).to.equal("".concat(defaultMicProtocol, "//").concat(instanceId, "-").concat(defaultMicHost));
      (0, _chai.expect)(init.appVersion).to.equal('2');
      (0, _chai.expect)(init.encryptionKey).to.equal(encryptionKey);
      done();
    });
  });
  describe('initialize', function () {
    it('should return deprecation error', function (done) {
      Kinvey.initialize({
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET
      }).then(function () {
        Promise.reject(new Error('An error for deprecated function should be returned.'));
      })["catch"](function (err) {
        (0, _chai.expect)(err.message).to.equal('initialize() has been deprecated. Please use init().');
        done();
      });
    });
  });
  describe('ping()', function () {
    it('should return kinvey response', function (done) {
      var init = Kinvey.init({
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET
      });
      Kinvey.ping().then(function (res) {
        (0, _chai.expect)(res.appName).to.not.equal(undefined);
        (0, _chai.expect)(res.environmentName).to.not.equal(undefined);
        (0, _chai.expect)(res.kinvey).to.contain('hello');
        (0, _chai.expect)(res.version).to.not.equal(undefined);
        done();
      })["catch"](function (err) {
        done(err);
      });
    });
  });
  describe('offline storage', function () {
    after(function (done) {
      utilities.cleanUpAppData(collectionName, createdUserIds).then(function () {
        return done();
      })["catch"](done);
    });
    it('should set IndexedDB as provider and use it to store data',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee5() {
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              _context5.next = 3;
              return setupOfflineProvider(Kinvey.StorageProvider.IndexedDB);

            case 3:
              _context5.next = 5;
              return checkIndexedDB();

            case 5:
              _context5.next = 10;
              break;

            case 7:
              _context5.prev = 7;
              _context5.t0 = _context5["catch"](0);
              throw new Error(_context5.t0);

            case 10:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, null, [[0, 7]]);
    })));
    it('should set WebSQL as provider and use it to store data',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee6() {
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.prev = 0;
              _context6.next = 3;
              return setupOfflineProvider(Kinvey.StorageProvider.WebSQL);

            case 3:
              _context6.next = 5;
              return checkWebSQL();

            case 5:
              _context6.next = 10;
              break;

            case 7:
              _context6.prev = 7;
              _context6.t0 = _context6["catch"](0);
              throw new Error(_context6.t0);

            case 10:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, null, [[0, 7]]);
    })));
    it('should set LocalStorage as provider and use it to store data',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee7() {
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.prev = 0;
              _context7.next = 3;
              return setupOfflineProvider(Kinvey.StorageProvider.LocalStorage);

            case 3:
              _context7.next = 5;
              return checkLocalStorage();

            case 5:
              _context7.next = 10;
              break;

            case 7:
              _context7.prev = 7;
              _context7.t0 = _context7["catch"](0);
              throw new Error(_context7.t0);

            case 10:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, null, [[0, 7]]);
    })));
    it('should set SessionStorage as provider and use it to store data',
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee8() {
      return regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.prev = 0;
              _context8.next = 3;
              return setupOfflineProvider(Kinvey.StorageProvider.SessionStorage);

            case 3:
              _context8.next = 5;
              return checkSessionStorage();

            case 5:
              _context8.next = 10;
              break;

            case 7:
              _context8.prev = 7;
              _context8.t0 = _context8["catch"](0);
              throw new Error(_context8.t0);

            case 10:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, null, [[0, 7]]);
    })));
  });
});