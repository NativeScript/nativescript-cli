'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SyncManager = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _babybird = require('babybird');

var _babybird2 = _interopRequireDefault(_babybird);

var _datastore = require('./stores/datastore');

var _errors = require('./errors');

var _metadata = require('./metadata');

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _reduce = require('lodash/reduce');

var _reduce2 = _interopRequireDefault(_reduce);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _mapSeries = require('async/mapSeries');

var _mapSeries2 = _interopRequireDefault(_mapSeries);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'kinvey_sync';
var idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
var kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

var SyncManager = exports.SyncManager = function () {
  function SyncManager() {
    _classCallCheck(this, SyncManager);
  }

  _createClass(SyncManager, [{
    key: 'count',
    value: function count(query) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = this.syncStore.find(query, options).then(function (syncEntities) {
        var size = (0, _reduce2.default)(syncEntities, function (sum, entity) {
          return sum + entity.size;
        }, 0);
        return size;
      });
      return promise;
    }
  }, {
    key: 'notify',
    value: function notify(name, entities) {
      var _this = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (!name) {
        return _babybird2.default.reject(new _errors.KinveyError('Unable to add entities to the sync table for a store with no name.'));
      }

      if (!entities) {
        return _babybird2.default.resolve(null);
      }

      var promise = this.syncStore.findById(name, options).catch(function (error) {
        if (error instanceof _errors.NotFoundError) {
          return {
            _id: name,
            entities: {},
            size: 0
          };
        }

        throw error;
      }).then(function (syncEntity) {
        if (!(0, _isArray2.default)(entities)) {
          entities = [entities];
        }

        (0, _forEach2.default)(entities, function (entity) {
          var id = entity[idAttribute];

          if (id) {
            if (!syncEntity.entities.hasOwnProperty(id)) {
              syncEntity.size = syncEntity.size + 1;
            }

            syncEntity.entities[id] = {};
          }
        });

        return _this.syncStore.save(syncEntity);
      }).then(function () {
        return null;
      });

      return promise;
    }
  }, {
    key: 'execute',
    value: function execute(query) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var promise = this.syncStore.find(query, options).then(function (syncEntities) {
        var promise = new _babybird2.default(function (resolve, reject) {
          (0, _mapSeries2.default)(syncEntities, function (syncEntity, callback) {
            var collectionName = syncEntity._id;
            var entities = syncEntity.entities;
            var syncSize = syncEntity.size;
            var ids = Object.keys(entities);
            var syncResult = { collection: collectionName, success: [], error: [] };
            var batchSize = 100;
            var i = 0;

            var collectionNetworkStore = _datastore.DataStore.getInstance(collectionName, _datastore.DataStoreType.Network);
            var collectionSyncStore = _datastore.DataStore.getInstance(collectionName, _datastore.DataStoreType.Sync);
            collectionSyncStore.disableSync();

            var batchSync = function batchSync() {
              var batchIds = ids.slice(i, i + batchSize);
              i += batchSize;

              var save = [];
              var remove = [];
              var promises = (0, _map2.default)(batchIds, function (id) {
                var promise = collectionSyncStore.findById(id).then(function (entity) {
                  save.push(entity);
                  return entity;
                }).catch(function (error) {
                  if (error instanceof _errors.NotFoundError) {
                    remove.push(id);
                    return null;
                  }

                  throw error;
                });
                return promise;
              });

              var promise = _babybird2.default.all(promises).then(function () {
                var saved = (0, _map2.default)(save, function (entity) {
                  var metadata = new _metadata.Metadata(entity);
                  var originalId = entity[idAttribute];
                  delete entity[kmdAttribute];

                  if (metadata.isLocal()) {
                    delete entity[idAttribute];
                  }

                  return collectionNetworkStore.save(entity, options).then(function (entity) {
                    return collectionSyncStore.save(entity, options);
                  }).then(function (entity) {
                    if (metadata.isLocal()) {
                      return collectionSyncStore.removeById(originalId, options).then(function () {
                        return entity;
                      });
                    }

                    return entity;
                  }).then(function (entity) {
                    syncSize = syncSize - 1;
                    delete entities[originalId];
                    return {
                      _id: originalId,
                      entity: entity
                    };
                  }).catch(function (error) {
                    // If the credentials used to authenticate this request are
                    // not authorized to run the operation then just remove the entity
                    // from the sync table
                    if (error instanceof _errors.InsufficientCredentialsError) {
                      syncSize = syncSize - 1;
                      delete entities[originalId];
                      return {
                        _id: originalId,
                        error: error
                      };
                    }

                    return {
                      _id: originalId,
                      error: error
                    };
                  });
                });

                var removed = (0, _map2.default)(remove, function (id) {
                  var promise = collectionNetworkStore.removeById(id, options).then(function () {
                    syncSize = syncSize - 1;
                    delete entities[id];
                    return {
                      _id: id
                    };
                  }).catch(function (error) {
                    // If the credentials used to authenticate this request are
                    // not authorized to run the operation or the entity was
                    // not found then just remove the entity from the sync table
                    if (error instanceof _errors.NotFoundError || error instanceof _errors.InsufficientCredentialsError) {
                      syncSize = syncSize - 1;
                      delete entities[id];
                      return {
                        _id: id,
                        error: error
                      };
                    }

                    return {
                      _id: id,
                      error: error
                    };
                  });
                  return promise;
                });

                return _babybird2.default.all([_babybird2.default.all(saved), _babybird2.default.all(removed)]);
              }).then(function (results) {
                var savedResults = results[0];
                var removedResults = results[1];
                var result = {
                  collection: collectionName,
                  success: [],
                  error: []
                };

                (0, _forEach2.default)(savedResults, function (savedResult) {
                  if (savedResult.error) {
                    result.error.push(savedResult);
                  } else {
                    result.success.push(savedResult);
                  }
                });

                (0, _forEach2.default)(removedResults, function (removedResult) {
                  if (removedResult.error) {
                    result.error.push(removedResult);
                  } else {
                    result.success.push(removedResult);
                  }
                });

                return result;
              }).then(function (result) {
                syncResult.success = syncResult.success.concat(result.success);
                syncResult.error = syncResult.error.concat(result.error);
                return syncResult;
              }).then(function (result) {
                if (i < ids.length) {
                  return batchSync();
                }

                return result;
              }).then(function (result) {
                syncEntity.size = syncSize;
                syncEntity.entities = entities;
                return _this2.syncStore.save(syncEntity, options).then(function () {
                  return result;
                });
              });

              return promise;
            };

            batchSync().then(function (result) {
              callback(null, result);
            }).catch(function (error) {
              callback(error);
            });
          }, function (error, results) {
            if (error) {
              return reject(error);
            }

            return results.length === 1 ? resolve(results[0]) : resolve(results);
          });
        });
        return promise;
      });
      return promise;
    }
  }, {
    key: 'syncStore',
    get: function get() {
      var syncStore = _datastore.DataStore.getInstance(syncCollectionName, _datastore.DataStoreType.Sync);
      syncStore.disableSync();
      return syncStore;
    }
  }]);

  return SyncManager;
}();