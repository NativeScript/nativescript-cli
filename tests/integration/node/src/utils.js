"use strict";

require("core-js/modules/es.array.concat");

require("core-js/modules/es.array.find");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.array.map");

require("core-js/modules/es.array-buffer.constructor");

require("core-js/modules/es.array-buffer.slice");

require("core-js/modules/es.date.to-string");

require("core-js/modules/es.function.name");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.keys");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.regexp.to-string");

require("core-js/modules/es.string.iterator");

require("core-js/modules/es.typed-array.uint16-array");

require("core-js/modules/es.typed-array.copy-within");

require("core-js/modules/es.typed-array.every");

require("core-js/modules/es.typed-array.fill");

require("core-js/modules/es.typed-array.filter");

require("core-js/modules/es.typed-array.find");

require("core-js/modules/es.typed-array.find-index");

require("core-js/modules/es.typed-array.for-each");

require("core-js/modules/es.typed-array.includes");

require("core-js/modules/es.typed-array.index-of");

require("core-js/modules/es.typed-array.iterator");

require("core-js/modules/es.typed-array.join");

require("core-js/modules/es.typed-array.last-index-of");

require("core-js/modules/es.typed-array.map");

require("core-js/modules/es.typed-array.reduce");

require("core-js/modules/es.typed-array.reduce-right");

require("core-js/modules/es.typed-array.reverse");

require("core-js/modules/es.typed-array.set");

require("core-js/modules/es.typed-array.slice");

require("core-js/modules/es.typed-array.some");

require("core-js/modules/es.typed-array.sort");

require("core-js/modules/es.typed-array.subarray");

require("core-js/modules/es.typed-array.to-locale-string");

require("core-js/modules/es.typed-array.to-string");

require("core-js/modules/web.dom-collections.for-each");

require("core-js/modules/web.dom-collections.iterator");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureArray = ensureArray;
exports.assertEntityMetadata = assertEntityMetadata;
exports.deleteEntityMetadata = deleteEntityMetadata;
exports.uid = uid;
exports.randomString = randomString;
exports.randomEmailAddress = randomEmailAddress;
exports.getEntity = getEntity;
exports.saveEntities = saveEntities;
exports.deleteUsers = deleteUsers;
exports.validateReadResult = validateReadResult;
exports.retrieveEntity = retrieveEntity;
exports.validatePendingSyncCount = validatePendingSyncCount;
exports.validateEntity = validateEntity;
exports.cleanUpCollectionData = cleanUpCollectionData;
exports.cleanAndPopulateCollection = cleanAndPopulateCollection;
exports.cleanUpAppData = cleanUpAppData;
exports.assertError = assertError;
exports.assertReadFileResult = assertReadFileResult;
exports.assertFileUploadResult = assertFileUploadResult;
exports.assertFileMetadata = assertFileMetadata;
exports.testFileUpload = testFileUpload;
exports.ArrayBufferFromString = ArrayBufferFromString;
exports.getFileMetadata = getFileMetadata;
exports.getExpectedFileMetadata = getExpectedFileMetadata;
exports.cleanUpCollection = cleanUpCollection;

require("regenerator-runtime/runtime");

var _chai = require("chai");

var _axios = _interopRequireDefault(require("axios"));

var _lodash = _interopRequireDefault(require("lodash"));

var Kinvey = _interopRequireWildcard(require("kinvey-node-sdk"));

var Constants = _interopRequireWildcard(require("./constants"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function ensureArray(entities) {
  return [].concat(entities);
}

;

function assertEntityMetadata(entities) {
  ensureArray(entities).forEach(function (entity) {
    (0, _chai.expect)(entity._kmd.lmt).to.exist;
    (0, _chai.expect)(entity._kmd.ect).to.exist;
    (0, _chai.expect)(entity._acl.creator).to.exist;
  });
}

function deleteEntityMetadata(entities) {
  ensureArray(entities).forEach(function (entity) {
    delete entity._kmd;
    delete entity._acl;
  });
  return entities;
}

function uid() {
  var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < size; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function randomString() {
  var size = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 18;
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  return "".concat(prefix).concat(uid(size));
}

function randomEmailAddress() {
  return "".concat(randomString(), "@test.com");
}

function getEntity(_id, textValue, numberValue, array) {
  var _entity;

  var entity = (_entity = {}, _defineProperty(_entity, Constants.TextFieldName, textValue || randomString()), _defineProperty(_entity, Constants.NumberFieldName, numberValue || numberValue === 0 ? numberValue : Math.random()), _defineProperty(_entity, Constants.ArrayFieldName, array || [randomString(), randomString()]), _entity);

  if (_id) {
    entity._id = _id;
  }

  return entity;
} // saves an array of entities and returns the result sorted by _id for an easier usage in 'find with modifiers' tests


function saveEntities(collectionName, entities) {
  var networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
  var syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
  return Promise.all(entities.map(function (entity) {
    return networkStore.save(entity);
  })).then(function () {
    return syncStore.pull();
  }).then(function () {
    return syncStore.find().toPromise();
  }).then(function (result) {
    return _lodash["default"].sortBy(deleteEntityMetadata(result), '_id');
  });
}

function deleteUsers(userIds) {
  return Promise.all(userIds.map(function (userId) {
    return Kinvey.User.remove(userId, {
      hard: true
    });
  }));
} // validates the result of a find() or a count() operation according to the DataStore type with an optional sorting
// works with a single entity, an array of entities or with numbers


function validateReadResult(dataStoreType, spy, cacheExpectedEntities, backendExpectedEntities, sortBeforeCompare) {
  var firstCallArgs = spy.firstCall.args[0];
  var secondCallArgs;

  if (dataStoreType === Kinvey.DataStoreType.Cache) {
    secondCallArgs = spy.secondCall.args[0];
  }

  var isComparingEntities = !_lodash["default"].isNumber(cacheExpectedEntities);
  var isSavedEntity = Object.prototype.hasOwnProperty.call(_lodash["default"].first(ensureArray(cacheExpectedEntities)), '_id');
  var shouldPrepareForComparison = isComparingEntities && isSavedEntity; // if we have entities, which have an _id field, we remove the metadata in order to compare properly and sort by _id if needed

  if (shouldPrepareForComparison) {
    deleteEntityMetadata(firstCallArgs);

    if (sortBeforeCompare) {
      firstCallArgs = _lodash["default"].sortBy(firstCallArgs, '_id');
      cacheExpectedEntities = _lodash["default"].sortBy(cacheExpectedEntities, '_id');
      backendExpectedEntities = _lodash["default"].sortBy(backendExpectedEntities, '_id');
    }

    if (secondCallArgs) {
      deleteEntityMetadata(secondCallArgs);

      if (sortBeforeCompare) {
        secondCallArgs = _lodash["default"].sortBy(secondCallArgs, '_id');
      }
    }
  } // the actual comparison, according to the Data Store type


  if (dataStoreType === Kinvey.DataStoreType.Network) {
    (0, _chai.expect)(spy.calledOnce).to.be["true"];
    (0, _chai.expect)(firstCallArgs).to.deep.equal(backendExpectedEntities);
  } else if (dataStoreType === Kinvey.DataStoreType.Sync) {
    (0, _chai.expect)(spy.calledOnce).to.be["true"];
    (0, _chai.expect)(firstCallArgs).to.deep.equal(cacheExpectedEntities);
  } else {
    (0, _chai.expect)(spy.calledTwice).to.be["true"];
    (0, _chai.expect)(firstCallArgs).to.deep.equal(cacheExpectedEntities);
    (0, _chai.expect)(secondCallArgs).to.deep.equal(backendExpectedEntities);
  }
}

function retrieveEntity(collectionName, dataStoreType, entity, searchField) {
  var store = Kinvey.DataStore.collection(collectionName, dataStoreType);
  var query = new Kinvey.Query();
  var propertyToSearchBy = searchField || '_id';
  query.equalTo(propertyToSearchBy, entity[propertyToSearchBy]);
  return store.find(query).toPromise().then(function (result) {
    return result[0];
  });
}

function validatePendingSyncCount(dataStoreType, collectionName, itemsForSyncCount) {
  if (dataStoreType !== Kinvey.DataStoreType.Network) {
    var expectedCount = 0;

    if (dataStoreType === Kinvey.DataStoreType.Sync) {
      expectedCount = itemsForSyncCount;
    }

    var store = Kinvey.DataStore.collection(collectionName, dataStoreType);
    return store.pendingSyncCount().then(function (syncCount) {
      (0, _chai.expect)(syncCount).to.equal(expectedCount);
    });
  }

  return Promise.resolve();
}

function validateEntity(dataStoreType, collectionName, expectedEntity, searchField) {
  var entityFromCache;
  var entityFromBackend;
  return retrieveEntity(collectionName, Kinvey.DataStoreType.Sync, expectedEntity, searchField).then(function (result) {
    if (result) {
      entityFromCache = deleteEntityMetadata(result);
    }

    return retrieveEntity(collectionName, Kinvey.DataStoreType.Network, expectedEntity, searchField);
  }).then(function (result) {
    if (result) {
      entityFromBackend = deleteEntityMetadata(result);
    }

    if (dataStoreType === Kinvey.DataStoreType.Network) {
      (0, _chai.expect)(entityFromCache).to.be.undefined;
      (0, _chai.expect)(entityFromBackend).to.deep.equal(expectedEntity);
    } else if (dataStoreType === Kinvey.DataStoreType.Sync) {
      (0, _chai.expect)(entityFromCache).to.deep.equal(expectedEntity);
      (0, _chai.expect)(entityFromBackend).to.be.undefined;
    } else {
      (0, _chai.expect)(entityFromCache).to.deep.equal(expectedEntity);
      (0, _chai.expect)(entityFromBackend).to.deep.equal(expectedEntity);
    }
  });
}

function cleanUpCollectionData(collectionName) {
  var networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network);
  var syncStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Sync);
  return networkStore.find().toPromise().then(function (entities) {
    if (entities && entities.length > 0) {
      var query = new Kinvey.Query();
      query.contains('_id', entities.map(function (a) {
        return a._id;
      }));
      return networkStore.remove(query);
    }

    return Promise.resolve();
  }).then(function () {
    return syncStore.clearSync();
  }).then(function () {
    return syncStore.clear();
  });
}

function cleanAndPopulateCollection(collectionName, entities) {
  return cleanUpCollectionData(collectionName).then(function () {
    return saveEntities(collectionName, entities);
  });
}

function cleanUpAppData(collectionName, createdUserIds) {
  var currentUserId;
  return Kinvey.User.logout().then(function () {
    return Kinvey.User.signup();
  }).then(function (user) {
    currentUserId = user.data._id;
    return cleanUpCollectionData(collectionName);
  }).then(function () {
    return deleteUsers(createdUserIds);
  }).then(function () {
    return deleteUsers([currentUserId]);
  }).then(function () {
    createdUserIds.length = 0;
    return Kinvey.User.logout();
  });
}

function assertError(error, expectedErrorName, expectedErrorMessage) {
  (0, _chai.expect)(error.name).to.equal(expectedErrorName);
  (0, _chai.expect)(error.message).to.equal(expectedErrorMessage);
}

function assertReadFileResult(file, expectedMetadata, byHttp, publicFile) {
  assertFileMetadata(file, expectedMetadata);
  var expectedProtocol = byHttp ? 'http://' : 'https://';
  (0, _chai.expect)(file._downloadURL).to.contain(expectedProtocol);

  if (publicFile) {
    (0, _chai.expect)(file._expiresAt).to.not.exist;
  } else {
    (0, _chai.expect)(file._expiresAt).to.exist;
  }
}

function assertFileUploadResult(file, expectedMetadata, expectedContent) {
  assertFileMetadata(file, expectedMetadata);
  (0, _chai.expect)(file._data).to.equal(expectedContent);
}

function assertFileMetadata(file, expectedMetadata) {
  (0, _chai.expect)(file._id).to.exist;
  (0, _chai.expect)(file._filename).to.exist;
  (0, _chai.expect)(file.mimeType).to.exist;
  (0, _chai.expect)(file.size).to.exist;
  (0, _chai.expect)(file._acl.creator).to.exist;
  (0, _chai.expect)(file._kmd.ect).to.exist;
  (0, _chai.expect)(file._kmd.lmt).to.exist;
  delete file._acl.creator;
  var fieldsNames = Object.keys(expectedMetadata);

  _lodash["default"].each(fieldsNames, function (fieldName) {
    (0, _chai.expect)(file[fieldName]).to.deep.equal(expectedMetadata[fieldName]);
  });
}

;

function testFileUpload(representation, metadata, expectedMetadata, expectedContent, query, done) {
  Kinvey.Files.upload(representation, metadata).then(function (result) {
    assertFileUploadResult(result, expectedMetadata, representation);
    var currentQuery = query || new Kinvey.Query();

    if (!query) {
      currentQuery.equalTo('_id', result._id);
    }

    return Kinvey.Files.find(currentQuery);
  }).then(function (result) {
    var fileMetadata = result[0];
    assertReadFileResult(fileMetadata, expectedMetadata, null, expectedMetadata._public);
    return Kinvey.Files.downloadByUrl(fileMetadata._downloadURL);
  }).then(function (result) {
    (0, _chai.expect)(result).to.equal(expectedContent);
    done();
  })["catch"](done);
}

function ArrayBufferFromString(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char

  var bufView = new Uint16Array(buf);

  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
}

function getFileMetadata(id, fileName, mimeType) {
  var metadata = {
    filename: fileName || randomString(),
    mimeType: mimeType || 'text/plain'
  };

  if (id) {
    metadata._id = id;
  }

  ;
  return metadata;
}

function getExpectedFileMetadata(metadata) {
  var expectedMetadata = _lodash["default"].cloneDeep(metadata);

  delete expectedMetadata.filename;
  expectedMetadata._filename = metadata.filename;
  return expectedMetadata;
}

function cleanUpCollection(_x, _x2) {
  return _cleanUpCollection.apply(this, arguments);
}

function _cleanUpCollection() {
  _cleanUpCollection = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(config, collectionName) {
    var response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return (0, _axios["default"])({
              headers: {
                Authorization: "Basic ".concat(Buffer.from("".concat(config.appKey, ":").concat(config.masterSecret)).toString('base64')),
                'Content-Type': 'application/json',
                'X-Kinvey-Delete-Entire-Collection': true,
                'X-Kinvey-Retain-collection-Metadata': true
              },
              method: 'POST',
              url: "https://baas.kinvey.com/rpc/".concat(config.appKey, "/remove-collection"),
              data: {
                collectionName: collectionName
              }
            });

          case 3:
            response = _context.sent;
            _context.next = 10;
            break;

          case 6:
            _context.prev = 6;
            _context.t0 = _context["catch"](0);

            if (_context.t0.response) {
              response = _context.t0.response;
            }

            throw _context.t0;

          case 10:
            if (!(response.status !== 200 && response.status !== 404)) {
              _context.next = 12;
              break;
            }

            throw new Error("".concat(collectionName, " collection cleanup failed!"));

          case 12:
            return _context.abrupt("return", null);

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 6]]);
  }));
  return _cleanUpCollection.apply(this, arguments);
}