import Promise from 'babybird';
import { DataStore, DataStoreType } from './stores/datastore';
import { InsufficientCredentialsError, NotFoundError } from '../errors';
import { Metadata } from './metadata';
import map from 'lodash/map';
import forEach from 'lodash/forEach';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const syncCollectionName = process.env.KINVEY_SYNC_COLLECTION_NAME || 'sync';
const idAttribute = process.env.KINVEY_ID_ATTRIBUTE || '_id';
const kmdAttribute = process.env.KINVEY_KMD_ATTRIBUTE || '_kmd';

export class Sync {
  get _pathname() {
    return `/${appdataNamespace}/${this.client.appKey}/${syncCollectionName}`;
  }

  execute(query, options = {}) {
    // TODO: handle this.client === undefined
    // TODO: handle sync disabled

    const syncStore = DataStore.getInstance(syncCollectionName, DataStoreType.Sync);
    syncStore.disableSync();

    const promise = syncStore.find(query, options).then(entities => {
      const promises = map(entities, syncEntity => {
        const collectionName = syncEntity._id;
        const collectionNetworkStore = DataStore.getInstance(collectionName, DataStoreType.Network);
        const collectionSyncStore = DataStore.getInstance(collectionName, DataStoreType.Sync);
        collectionSyncStore.disableSync();
        const entities = syncEntity.entities;
        let syncSize = syncEntity.size;
        const ids = Object.keys(entities);
        const syncResult = { collection: collectionName, success: [], error: [] };
        const batchSize = 1000;
        let i = 0;

        const batchSync = () => {
          const batchIds = ids.slice(i, i + batchSize);
          i += batchSize;

          const save = [];
          const remove = [];
          const promises = map(batchIds, id => {
            const promise = collectionSyncStore.findById(id).then(entity => {
              save.push(entity);
              return entity;
            }).catch(error => {
              if (error instanceof NotFoundError) {
                remove.push(id);
                return null;
              }

              throw error;
            });
            return promise;
          });

          const promise = Promise.all(promises).then(() => {
            const saved = map(save, entity => {
              const metadata = new Metadata(entity);
              const originalId = entity[idAttribute];
              delete entity[kmdAttribute];

              if (metadata.isLocal()) {
                delete entity[idAttribute];
              }

              return collectionNetworkStore.save(entity, options)
                .then(entity => collectionSyncStore.save(entity, options))
                .then(entity => {
                  if (metadata.isLocal()) {
                    return collectionSyncStore.removeById(originalId, options).then(() => entity);
                  }

                  return entity;
                }).then(entity => {
                  syncSize = syncSize - 1;
                  delete entities[originalId];
                  return {
                    _id: originalId,
                    entity: entity
                  };
                }).catch(error => {
                  // If the credentials used to authenticate this request are
                  // not authorized to run the operation then just remove the entity
                  // from the sync table
                  if (error instanceof InsufficientCredentialsError) {
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

            const removed = map(remove, id => {
              const promise = collectionNetworkStore.removeById(id, options).then(() => {
                syncSize = syncSize - 1;
                delete entities[id];
                return {
                  _id: id
                };
              }).catch(error => {
                // If the credentials used to authenticate this request are
                // not authorized to run the operation or the entity was
                // not found then just remove the entity from the sync table
                if (error instanceof NotFoundError || error instanceof InsufficientCredentialsError) {
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

            return Promise.all([Promise.all(saved), Promise.all(removed)]);
          }).then(results => {
            const savedResults = results[0];
            const removedResults = results[1];
            const result = {
              collection: name,
              success: [],
              error: []
            };

            forEach(savedResults, savedResult => {
              if (savedResult.error) {
                result.error.push(savedResult);
              } else {
                result.success.push(savedResult);
              }
            });

            forEach(removedResults, removedResult => {
              if (removedResult.error) {
                result.error.push(removedResult);
              } else {
                result.success.push(removedResult);
              }
            });

            return result;
          }).then(result => {
            syncResult.success = syncResult.success.concat(result.success);
            syncResult.error = syncResult.error.concat(result.error);
            return syncResult;
          }).then(result => {
            if (i < ids.length) {
              return batchSync();
            }

            return result;
          }).then(result => {
            syncEntity.size = syncSize;
            syncEntity.entities = entities;
            return syncStore.save(syncEntity, options).then(() => result);
          });

          return promise;
        };

        return batchSync();
      });
      return Promise.all(promises);
    });
    return promise;
  }
}
