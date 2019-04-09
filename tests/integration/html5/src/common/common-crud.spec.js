"use strict";

require("core-js/modules/es.array.filter");

require("core-js/modules/es.array.find");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.array.iterator");

require("core-js/modules/es.array.slice");

require("core-js/modules/es.function.name");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.regexp.constructor");

require("core-js/modules/es.regexp.exec");

require("core-js/modules/es.regexp.to-string");

require("core-js/modules/es.string.iterator");

require("core-js/modules/web.dom-collections.for-each");

require("core-js/modules/web.dom-collections.iterator");

var _chai = require("chai");

var sinon = _interopRequireWildcard(require("sinon"));

var _lodash = _interopRequireDefault(require("lodash"));

var Kinvey = _interopRequireWildcard(require("kinvey-html5-sdk"));

var utilities = _interopRequireWildcard(require("../utils"));

var externalConfig = _interopRequireWildcard(require("../config"));

var Constants = _interopRequireWildcard(require("../constants"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var dataStoreTypes = [Kinvey.DataStoreType.Network, Kinvey.DataStoreType.Cache, Kinvey.DataStoreType.Sync];
var invalidQueryMessage = 'Invalid query. It must be an instance of the Query class.';
var notFoundErrorName = 'NotFoundError';
var collectionName = externalConfig.collectionName;
dataStoreTypes.forEach(function (currentDataStoreType) {
  describe("CRUD Entity - ".concat(currentDataStoreType), function () {
    var textFieldName = Constants.TextFieldName;
    var numberFieldName = Constants.NumberFieldName;
    var arrayFieldName = Constants.ArrayFieldName;
    var networkStore;
    var storeToTest;
    var dataStoreType = currentDataStoreType;
    var createdUserIds = [];
    var entity1 = utilities.getEntity(utilities.randomString());
    var entity2 = utilities.getEntity(utilities.randomString());
    var entity3 = utilities.getEntity(utilities.randomString());
    before(function () {
      return Kinvey.init({
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET,
        masterSecret: process.env.MASTER_SECRET
      });
    });
    before(function (done) {
      utilities.cleanUpAppData(collectionName, createdUserIds).then(function () {
        return Kinvey.User.signup();
      }).then(function (user) {
        createdUserIds.push(user.data._id); // store for setup

        networkStore = Kinvey.DataStore.collection(collectionName, Kinvey.DataStoreType.Network); // store to test

        storeToTest = Kinvey.DataStore.collection(collectionName, dataStoreType);
        done();
      })["catch"](done);
    });
    after(function (done) {
      utilities.cleanUpAppData(collectionName, createdUserIds).then(function () {
        return done();
      })["catch"](done);
    });
    describe('find and count operations', function () {
      before(function (done) {
        networkStore.save(entity1).then(function () {
          return networkStore.save(entity2);
        }).then(function () {
          if (dataStoreType !== Kinvey.DataStoreType.Network) {
            return storeToTest.pull();
          }

          return Promise.resolve();
        }).then(function () {
          return networkStore.save(entity3);
        }).then(function () {
          return done();
        })["catch"](done);
      });
      describe('count()', function () {
        it('should throw an error for an invalid query', function (done) {
          storeToTest.count({}).subscribe(null, function (error) {
            try {
              (0, _chai.expect)(error.message).to.equal(invalidQueryMessage);
              done();
            } catch (e) {
              done(e);
            }
          });
        });
        it('should return the count for the collection', function (done) {
          var onNextSpy = sinon.spy();
          storeToTest.count().subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, 2, 3);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('should return the count of the entities that match the query', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          var onNextSpy = sinon.spy();
          storeToTest.count(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, 1, 1);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      });
      describe('find()', function () {
        it('should throw an error if the query argument is not an instance of the Query class', function (done) {
          storeToTest.find({}).subscribe(null, function (error) {
            try {
              (0, _chai.expect)(error.message).to.equal(invalidQueryMessage);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('should return all the entities', function (done) {
          var onNextSpy = sinon.spy();
          storeToTest.find().subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, [entity1, entity2], [entity1, entity2, entity3], true);
              return utilities.retrieveEntity(collectionName, Kinvey.DataStoreType.Sync, entity3).then(function (result) {
                if (result) {
                  result = utilities.deleteEntityMetadata(result);
                }

                (0, _chai.expect)(result).to.deep.equal(dataStoreType === Kinvey.DataStoreType.Cache ? entity3 : undefined);
                done();
              })["catch"](done);
            } catch (error) {
              done(error);
            }

            return Promise.resolve();
          });
        });
        it('should find the entities that match the query', function (done) {
          var onNextSpy = sinon.spy();
          var query = new Kinvey.Query();
          query.equalTo('_id', entity2._id);
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, [entity2], [entity2]);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      });
      describe('findById()', function () {
        it('should throw a NotFoundError if an entity with the given id does not exist', function (done) {
          var entityId = utilities.randomString();
          var nextHandlerSpy = sinon.spy();
          storeToTest.findById(entityId).subscribe(nextHandlerSpy, function (err) {
            var expectedCallCount = dataStoreType === Kinvey.DataStoreType.Cache ? 1 : 0;

            try {
              (0, _chai.expect)(nextHandlerSpy.callCount).to.equal(expectedCallCount);
              (0, _chai.expect)(err.name).to.contain(notFoundErrorName);
            } catch (err) {
              return done(err);
            }

            return done();
          }, function () {
            done(new Error('Should not be called'));
          });
        });
        it('should return undefined if an id is not provided', function (done) {
          var spy = sinon.spy();
          storeToTest.findById().subscribe(spy, done, function () {
            try {
              (0, _chai.expect)(spy.callCount).to.equal(1);
              var result = spy.firstCall.args[0];
              (0, _chai.expect)(result).to.be.undefined;
            } catch (err) {
              return done(err);
            }

            return done();
          });
        });
        it('should return the entity that matches the id argument', function (done) {
          var onNextSpy = sinon.spy();
          storeToTest.findById(entity2._id).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, entity2, entity2);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      });
    }); // These are smoke tests and will not be executed for now.
    // If we decide to execute 'Modifiers' describe only for Sync data store, these tests will be added back

    describe.skip('find with modifiers', function () {
      var entities = [];
      var dataCount = 10;
      before(function (done) {
        for (var i = 0; i < dataCount; i += 1) {
          entities.push(utilities.getEntity());
        }

        utilities.cleanAndPopulateCollection(collectionName, entities).then(function (result) {
          entities = result;
          done();
        })["catch"](done);
      });
      it('should sort ascending and skip correctly', function (done) {
        var onNextSpy = sinon.spy();
        var query = new Kinvey.Query();
        query.skip = dataCount - 2;
        query.ascending('_id');
        var expectedEntities = [entities[dataCount - 2], entities[dataCount - 1]];
        storeToTest.find(query).subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
            done();
          } catch (error) {
            done(error);
          }
        });
      });
      it('should sort descending and limit correctly', function (done) {
        var onNextSpy = sinon.spy();
        var query = new Kinvey.Query();
        query.limit = 2;
        query.descending('_id');
        var expectedEntities = [entities[dataCount - 1], entities[dataCount - 2]];
        storeToTest.find(query).subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
            done();
          } catch (error) {
            done(error);
          }
        });
      });
      it('should skip and limit correctly', function (done) {
        var onNextSpy = sinon.spy();
        var query = new Kinvey.Query();
        query.limit = 1;
        query.skip = dataCount - 2;
        query.ascending('_id');
        var expectedEntity = entities[dataCount - 2];
        storeToTest.find(query).subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(dataStoreType, onNextSpy, [expectedEntity], [expectedEntity]);
            done();
          } catch (error) {
            done(error);
          }
        });
      }); // skipped because of a bug for syncStore and different behaviour of fields for Sync and Network

      it('with fields should return only the specified fields', function (done) {
        var onNextSpy = sinon.spy();
        var query = new Kinvey.Query();
        query.fields = [[textFieldName]];
        query.ascending('_id');

        var expectedEntity = _defineProperty({}, textFieldName, entities[dataCount - 2][textFieldName]);

        storeToTest.find(query).subscribe(onNextSpy, done, function () {
          try {
            utilities.validateReadResult(dataStoreType, onNextSpy, [expectedEntity], [expectedEntity]);
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
    describe('Querying', function () {
      var entities = [];
      var dataCount = 10;
      var secondSortField = 'secondSortField';
      var onNextSpy;
      var query;
      before(function (done) {
        for (var i = 0; i < dataCount; i += 1) {
          entities.push(utilities.getEntity(null, "test_".concat(i), i, ["test_".concat(i % 5), "second_test_".concat(i % 5), "third_test_".concat(i % 5)]));
        }

        var textArray = ['aaa', 'aaB', 'aac'];

        for (var _i = 0; _i < dataCount; _i += 1) {
          entities[_i].secondSortField = textArray[_i % 3];
        } // used to test exists and size operators and null values


        entities[dataCount - 1][textFieldName] = null;
        delete entities[dataCount - 1][numberFieldName];
        entities[dataCount - 1][arrayFieldName] = [];
        entities[dataCount - 2][arrayFieldName] = [{}, {}];
        utilities.cleanAndPopulateCollection(collectionName, entities).then(function (result) {
          entities = _lodash["default"].sortBy(result, numberFieldName);
          done();
        })["catch"](done);
      });
      beforeEach(function (done) {
        onNextSpy = sinon.spy();
        query = new Kinvey.Query();
        done();
      });
      describe('Comparison operators', function () {
        it('query.equalTo', function (done) {
          query.equalTo(textFieldName, entities[5][textFieldName]);
          var expectedEntities = [entities[5]];
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('query.equalTo with null', function (done) {
          query.equalTo(textFieldName, null);
          var expectedEntities = [entities[dataCount - 1]];
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('query.notEqualTo', function (done) {
          query.notEqualTo(textFieldName, entities[5][textFieldName]);
          var expectedEntities = entities.filter(function (entity) {
            return entity !== entities[5];
          });
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('query.notEqualTo with null', function (done) {
          query.notEqualTo(textFieldName, null);
          var expectedEntities = entities.filter(function (entity) {
            return entity[textFieldName] !== null;
          });
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('query.greaterThan', function (done) {
          query.greaterThan(numberFieldName, entities[dataCount - 3][numberFieldName]);
          var expectedEntities = [entities[dataCount - 2]];
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('query.greaterThanOrEqualTo', function (done) {
          query.greaterThanOrEqualTo(numberFieldName, entities[dataCount - 3][numberFieldName]);
          var expectedEntities = [entities[dataCount - 3], entities[dataCount - 2]];
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('query.lessThan', function (done) {
          query.lessThan(numberFieldName, entities[2][numberFieldName]);
          var expectedEntities = [entities[0], entities[1]];
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('query.lessThanOrEqualTo', function (done) {
          query.lessThanOrEqualTo(numberFieldName, entities[1][numberFieldName]);
          var expectedEntities = [entities[0], entities[1]];
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('query.exists', function (done) {
          query.exists(numberFieldName);
          var expectedEntities = entities.filter(function (entity) {
            return entity !== entities[dataCount - 1];
          });
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('query.mod', function (done) {
          query.mod(numberFieldName, 4, 2);
          var expectedEntities = entities.filter(function (entity) {
            return entity[numberFieldName] % 4 === 2;
          });
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
              done();
            } catch (error) {
              done(error);
            }
          });
        }); // TODO: Add more tests for regular expression

        it('query.matches - with RegExp literal', function (done) {
          query.matches(textFieldName, /^test_5/);
          var expectedEntities = [entities[5]];
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('query.matches - with RegExp object', function (done) {
          query.matches(textFieldName, new RegExp('^test_5'));
          var expectedEntities = [entities[5]];
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
        it('multiple operators', function (done) {
          query.lessThan(numberFieldName, entities[2][numberFieldName]).greaterThan(numberFieldName, entities[0][numberFieldName]);
          var expectedEntities = [entities[1]];
          storeToTest.find(query).subscribe(onNextSpy, done, function () {
            try {
              utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      });
      describe('Array Operators', function () {
        describe('query.contains()', function () {
          it('with single value', function (done) {
            query.contains(textFieldName, entities[5][textFieldName]);
            var expectedEntities = [entities[5]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('string field with an array of values', function (done) {
            query.contains(textFieldName, entities[0][arrayFieldName]);
            var expectedEntities = [entities[0]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('array field with an array of values', function (done) {
            query.contains(arrayFieldName, entities[0][arrayFieldName]);
            var expectedEntities = [entities[0], entities[5]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('in combination with an existing filter', function (done) {
            query.notEqualTo(numberFieldName, entities[1][numberFieldName]);
            query.contains(textFieldName, [entities[0][textFieldName], entities[1][textFieldName]]);
            var expectedEntities = [entities[0]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('with null value', function (done) {
            query.contains(textFieldName, [null]);
            var expectedEntities = [entities[dataCount - 1]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
        });
        describe('query.containsAll()', function () {
          it('with single value', function (done) {
            query.containsAll(textFieldName, entities[5][textFieldName]);
            var expectedEntities = [entities[5]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('string field with an array of values', function (done) {
            query.containsAll(textFieldName, [entities[5][textFieldName]]);
            var expectedEntities = [entities[5]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('array field with an array of values', function (done) {
            var arrayFieldValue = entities[5][arrayFieldName];
            var filteredArray = arrayFieldValue.filter(function (entity) {
              return entity !== arrayFieldValue[2];
            });
            query.containsAll(arrayFieldName, filteredArray);
            var expectedEntities = [entities[0], entities[5]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('in combination with an existing filter', function (done) {
            query.notEqualTo(numberFieldName, entities[0][numberFieldName]);
            query.containsAll(arrayFieldName, entities[5][arrayFieldName]);
            var expectedEntities = [entities[5]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
        });
        describe('query.notContainedIn()', function () {
          it('with single value', function (done) {
            query.notContainedIn(textFieldName, entities[5][textFieldName]);
            var expectedEntities = entities.filter(function (entity) {
              return entity !== entities[5];
            });
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('string property with an array of values', function (done) {
            query.notContainedIn(textFieldName, entities[0][arrayFieldName]);
            var expectedEntities = entities.filter(function (entity) {
              return entity !== entities[0];
            });
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('array field with an array of values', function (done) {
            query.notContainedIn(arrayFieldName, entities[0][arrayFieldName]);
            var expectedEntities = entities.filter(function (entity) {
              return entity !== entities[0] && entity !== entities[5];
            });
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('in combination with an existing filter', function (done) {
            query.lessThanOrEqualTo(numberFieldName, entities[1][numberFieldName]);
            query.notContainedIn(textFieldName, entities[0][arrayFieldName]);
            var expectedEntities = [entities[1]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
        });
        describe('query.size()', function () {
          it('should return the elements with an array field, having the submitted size', function (done) {
            query.size(arrayFieldName, 3);
            var expectedEntities = entities.filter(function (entity) {
              return entity !== entities[dataCount - 1] && entity !== entities[dataCount - 2];
            });
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities, true);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('should return the elements with an empty array field, if the submitted size = 0', function (done) {
            query.size(arrayFieldName, 0);
            var expectedEntities = [entities[dataCount - 1]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('in combination with an existing filter', function (done) {
            query.greaterThanOrEqualTo(numberFieldName, entities[dataCount - 3][numberFieldName]);
            query.size(arrayFieldName, 3);
            var expectedEntities = [entities[dataCount - 3]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
        });
      });
      describe('Modifiers', function () {
        var expectedAscending;
        var expectedDescending;
        before(function (done) {
          expectedAscending = _lodash["default"].sortBy(entities, numberFieldName); // moving entities with null values to the beginning of the array, as this is the sort order on the server

          expectedAscending.unshift(expectedAscending.pop());
          expectedDescending = expectedAscending.slice().reverse();
          done();
        });
        describe('Sort, Skip, Limit', function () {
          it('should sort ascending', function (done) {
            query.ascending(numberFieldName);
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedAscending, expectedAscending);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('should sort descending', function (done) {
            query.descending(numberFieldName);
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedDescending, expectedDescending);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it.skip('should sort by two fields ascending and descending', function (done) {
            query.ascending(secondSortField);
            query.descending(textFieldName);
            query.notEqualTo('_id', entities[dataCount - 1]._id);

            var sortedEntities = _lodash["default"].orderBy(entities, [secondSortField, textFieldName], ['asc', 'desc']);

            var expectedEntities = sortedEntities.filter(function (entity) {
              return entity !== entities[dataCount - 1];
            });
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('should skip correctly', function (done) {
            query.skip = dataCount - 3;
            query.descending(numberFieldName);
            var expectedEntities = expectedDescending.slice(dataCount - 3, dataCount);
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('should limit correctly', function (done) {
            query.limit = 2;
            query.descending(numberFieldName);
            var expectedEntities = expectedDescending.slice(0, 2);
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('should skip and then limit correctly', function (done) {
            query.limit = 2;
            query.skip = 3;
            query.descending(numberFieldName);
            var expectedEntities = expectedDescending.slice(3, 5);
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
        });
        describe('Compound queries', function () {
          it('combine a filter with a modifier', function (done) {
            var numberfieldValue = entities[dataCount - 3][numberFieldName];
            query.limit = 1;
            query.ascending(numberFieldName);
            query.greaterThanOrEqualTo(numberFieldName, numberfieldValue);
            var expectedEntities = [entities[dataCount - 3]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('two queries with a logical AND', function (done) {
            var numberfieldValue = entities[dataCount - 3][numberFieldName];
            query.greaterThanOrEqualTo(numberFieldName, numberfieldValue);
            var secondQuery = new Kinvey.Query();
            secondQuery.lessThanOrEqualTo(numberFieldName, numberfieldValue);
            query.and(secondQuery);
            var expectedEntities = [entities[dataCount - 3]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('two queries with a logical OR', function (done) {
            query.ascending(numberFieldName);
            query.equalTo(numberFieldName, entities[dataCount - 3][numberFieldName]);
            var secondQuery = new Kinvey.Query();
            secondQuery.equalTo(numberFieldName, entities[dataCount - 2][numberFieldName]);
            query.or(secondQuery);
            var expectedEntities = [entities[dataCount - 3], entities[dataCount - 2]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('two queries with a logical NOR', function (done) {
            var numberfieldValue = entities[dataCount - 3][numberFieldName];
            query.ascending(numberFieldName);
            query.greaterThan(numberFieldName, numberfieldValue);
            var secondQuery = new Kinvey.Query();
            secondQuery.lessThan(numberFieldName, numberfieldValue); // expect entities with numberFieldName not equal to entities[dataCount - 3]

            query.nor(secondQuery);
            var expectedEntities = [entities[dataCount - 1], entities[dataCount - 3]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
          it('two queries with an inline join operator', function (done) {
            var numberfieldValue = entities[dataCount - 3][numberFieldName];
            query.greaterThanOrEqualTo(numberFieldName, numberfieldValue).and().lessThanOrEqualTo(numberFieldName, numberfieldValue);
            var expectedEntities = [entities[dataCount - 3]];
            storeToTest.find(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, expectedEntities, expectedEntities);
                done();
              } catch (error) {
                done(error);
              }
            });
          });
        });
      });
    });
    describe('save/create/update operations', function () {
      before(function (done) {
        utilities.cleanAndPopulateCollection(collectionName, [entity1, entity2]).then(function () {
          return done();
        })["catch"](done);
      });
      beforeEach(function () {
        if (dataStoreType !== Kinvey.DataStoreType.Network) {
          return storeToTest.clearSync();
        }

        return Promise.resolve();
      });
      describe('save()', function () {
        it('should throw an error when trying to save an array of entities', function (done) {
          storeToTest.save([entity1, entity2])["catch"](function (error) {
            (0, _chai.expect)(error.message).to.equal('Unable to create an array of entities. Please create entities one by one.');
            done();
          })["catch"](done);
        });
        it('should create a new entity without _id', function (done) {
          var newEntity = _defineProperty({}, textFieldName, utilities.randomString());

          storeToTest.save(newEntity).then(function (createdEntity) {
            (0, _chai.expect)(createdEntity._id).to.exist;
            (0, _chai.expect)(createdEntity[textFieldName]).to.equal(newEntity[textFieldName]);

            if (dataStoreType === Kinvey.DataStoreType.Sync) {
              (0, _chai.expect)(createdEntity._kmd.local).to.be["true"];
            } else {
              utilities.assertEntityMetadata(createdEntity);
            }

            newEntity._id = createdEntity._id;
            return utilities.validateEntity(dataStoreType, collectionName, newEntity);
          }).then(function () {
            return utilities.validatePendingSyncCount(dataStoreType, collectionName, 1);
          }).then(function () {
            return done();
          })["catch"](done);
        });
        it('should create a new entity using its _id', function (done) {
          var id = utilities.randomString();
          var textFieldValue = utilities.randomString();
          var newEntity = utilities.getEntity(id, textFieldValue);
          storeToTest.save(newEntity).then(function (createdEntity) {
            (0, _chai.expect)(createdEntity._id).to.equal(id);
            (0, _chai.expect)(createdEntity[textFieldName]).to.equal(textFieldValue);
            return utilities.validateEntity(dataStoreType, collectionName, newEntity);
          }).then(function () {
            return done();
          })["catch"](done);
        });
        it('should update an existing entity', function (done) {
          var _entityToUpdate;

          var entityToUpdate = (_entityToUpdate = {
            _id: entity1._id
          }, _defineProperty(_entityToUpdate, textFieldName, entity1[textFieldName]), _defineProperty(_entityToUpdate, "newProperty", utilities.randomString()), _entityToUpdate);
          storeToTest.save(entityToUpdate).then(function (updatedEntity) {
            (0, _chai.expect)(updatedEntity._id).to.equal(entity1._id);
            (0, _chai.expect)(updatedEntity.newProperty).to.equal(entityToUpdate.newProperty);
            return utilities.validateEntity(dataStoreType, collectionName, entityToUpdate, 'newProperty');
          }).then(function () {
            return utilities.validatePendingSyncCount(dataStoreType, collectionName, 1);
          }).then(function () {
            return done();
          })["catch"](done);
        });
      });
      describe('create()', function () {
        it('should throw an error when trying to create an array of entities', function (done) {
          storeToTest.create([entity1, entity2])["catch"](function (error) {
            (0, _chai.expect)(error.message).to.equal('Unable to create an array of entities. Please create entities one by one.');
            done();
          })["catch"](done);
        });
        it('should create a new entity without _id', function (done) {
          var newEntity = _defineProperty({}, textFieldName, utilities.randomString());

          storeToTest.create(newEntity).then(function (createdEntity) {
            (0, _chai.expect)(createdEntity._id).to.exist;
            (0, _chai.expect)(createdEntity[textFieldName]).to.equal(newEntity[textFieldName]);

            if (dataStoreType === Kinvey.DataStoreType.Sync) {
              (0, _chai.expect)(createdEntity._kmd.local).to.be["true"];
            } else {
              utilities.assertEntityMetadata(createdEntity);
            }

            newEntity._id = createdEntity._id;
            return utilities.validateEntity(dataStoreType, collectionName, newEntity);
          }).then(function () {
            return utilities.validatePendingSyncCount(dataStoreType, collectionName, 1);
          }).then(function () {
            return done();
          })["catch"](done);
        });
        it('should create a new entity using its _id', function (done) {
          var id = utilities.randomString();
          var textFieldValue = utilities.randomString();
          var newEntity = utilities.getEntity(id, textFieldValue);
          storeToTest.create(newEntity).then(function (createdEntity) {
            (0, _chai.expect)(createdEntity._id).to.equal(id);
            (0, _chai.expect)(createdEntity[textFieldName]).to.equal(textFieldValue);
            return utilities.validateEntity(dataStoreType, collectionName, newEntity);
          }).then(function () {
            return done();
          })["catch"](done);
        });
        it('should create 10 concurrent items', function (done) {
          var itemCount = 10;

          var promises = _lodash["default"].times(itemCount, function () {
            var entity = utilities.getEntity(utilities.randomString());
            return storeToTest.create(entity);
          });

          Promise.all(promises).then(function (createdEntities) {
            (0, _chai.expect)(createdEntities.length).to.equal(itemCount);
            done();
          })["catch"](done);
        });
      });
      describe('update()', function () {
        it('should throw an error when trying to update an array of entities', function (done) {
          storeToTest.update([entity1, entity2])["catch"](function (error) {
            (0, _chai.expect)(error.message).to.equal('Unable to update an array of entities. Please update entities one by one.');
            done();
          })["catch"](done);
        });
        it('should throw an error when trying to update without supplying an _id', function (done) {
          var expectedErrorMessage = 'The entity provided does not contain an _id';
          storeToTest.update({
            test: 'test'
          })["catch"](function (error) {
            (0, _chai.expect)(error.message).to.contain(expectedErrorMessage);
            done();
          })["catch"](done);
        });
        it('with a not existing _id should create a new entity using the supplied _id', function (done) {
          var id = utilities.randomString();
          var textFieldValue = utilities.randomString();
          var newEntity = utilities.getEntity(id, textFieldValue);
          storeToTest.update(newEntity).then(function (createdEntity) {
            (0, _chai.expect)(createdEntity._id).to.equal(id);
            (0, _chai.expect)(createdEntity[textFieldName]).to.equal(textFieldValue);
            return utilities.validateEntity(dataStoreType, collectionName, newEntity);
          }).then(function () {
            return done();
          })["catch"](done);
        });
        it('should update an existing entity', function (done) {
          var _entityToUpdate2;

          var entityToUpdate = (_entityToUpdate2 = {
            _id: entity1._id
          }, _defineProperty(_entityToUpdate2, textFieldName, entity1[textFieldName]), _defineProperty(_entityToUpdate2, "newProperty", utilities.randomString()), _entityToUpdate2);
          storeToTest.update(entityToUpdate).then(function (updatedEntity) {
            (0, _chai.expect)(updatedEntity._id).to.equal(entity1._id);
            (0, _chai.expect)(updatedEntity.newProperty).to.equal(entityToUpdate.newProperty);
            return utilities.validateEntity(dataStoreType, collectionName, entityToUpdate, 'newProperty');
          }).then(function () {
            return utilities.validatePendingSyncCount(dataStoreType, collectionName, 1);
          }).then(function () {
            return done();
          })["catch"](done);
        });
      });
    });
    describe('destroy operations', function () {
      before(function (done) {
        utilities.cleanAndPopulateCollection(collectionName, [entity1, entity2]).then(function () {
          return done();
        })["catch"](done);
      });
      describe('removeById()', function () {
        it('should throw an error if the id argument does not exist', function (done) {
          storeToTest.removeById(utilities.randomString()).then(function () {
            return done(new Error('Should not be called'));
          })["catch"](function (error) {
            (0, _chai.expect)(error.name).to.contain(notFoundErrorName);
            done();
          })["catch"](done);
        });
        it('should remove only the entity that matches the id argument', function (done) {
          var newEntity = {
            _id: utilities.randomString()
          };
          storeToTest.save(newEntity).then(function () {
            return storeToTest.removeById(newEntity._id);
          }).then(function (result) {
            (0, _chai.expect)(result.count).to.equal(1);
            var onNextSpy = sinon.spy();
            var query = new Kinvey.Query();
            query.equalTo('_id', newEntity._id);
            return storeToTest.count(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, 0, 0);
                return storeToTest.count().toPromise().then(function (count) {
                  (0, _chai.expect)(count).to.equal(2);
                  done();
                })["catch"](done);
              } catch (error) {
                done(error);
              }

              return null;
            });
          })["catch"](done);
        });
      });
      describe('remove()', function () {
        before(function () {
          if (dataStoreType !== Kinvey.DataStoreType.Network) {
            return storeToTest.clearSync();
          }

          return Promise.resolve();
        });
        it('should throw an error for an invalid query', function (done) {
          storeToTest.remove({})["catch"](function (error) {
            (0, _chai.expect)(error.message).to.equal(invalidQueryMessage);
            done();
          })["catch"](done);
        });
        it('should remove all entities that match the query', function (done) {
          var newEntity = utilities.getEntity();
          var query = new Kinvey.Query();
          query.equalTo(textFieldName, newEntity[textFieldName]);
          var initialCount;
          utilities.saveEntities(collectionName, [newEntity, newEntity]).then(function () {
            return storeToTest.count().toPromise();
          }).then(function (count) {
            initialCount = count;
            return storeToTest.remove(query);
          }).then(function (result) {
            (0, _chai.expect)(result.count).to.equal(2);
            var onNextSpy = sinon.spy();
            return storeToTest.count(query).subscribe(onNextSpy, done, function () {
              try {
                utilities.validateReadResult(dataStoreType, onNextSpy, 0, 0);
                return storeToTest.count().toPromise().then(function (count) {
                  (0, _chai.expect)(count).to.equal(initialCount - 2);
                  done();
                })["catch"](done);
              } catch (error) {
                done(error);
              }

              return null;
            });
          })["catch"](done);
        });
        it('should return a { count: 0 } when no entities are removed', function (done) {
          var query = new Kinvey.Query();
          query.equalTo('_id', utilities.randomString());
          storeToTest.remove(query).then(function (result) {
            (0, _chai.expect)(result.count).to.equal(0);
            done();
          })["catch"](done);
        });
      });
    });
  });
});