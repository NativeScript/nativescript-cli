import { Query } from '../query';
import { SyncError } from '../errors/sync';
import { NotFoundError } from '../errors/notFound';
import { NetworkStore } from './networkstore';
import { DataStoreCache, SyncCache, SyncEvent } from './cache';

const pushInProgress = new Map<string, boolean>();

function markPushStart(collectionName: string) {
  pushInProgress.set(collectionName, true);
}

function markPushEnd(collectionName: string) {
  pushInProgress.set(collectionName, false);;
}

export function queryToSyncQuery(query?: Query, collectionName?: string) {
  if (query && query instanceof Query) {
    const newFilter = Object.keys(query.filter)
      .reduce((filter, field) => Object.assign({}, filter, { [`entity.${field}`]: query.filter[field] }), {});
    const newSort = Object.keys(query.sort)
      .reduce((sort, field) => Object.assign({}, sort, { [`entity.${field}`]: query.sort[field] }), {});
    const syncQuery = new Query({
      filter: newFilter,
      sort: newSort,
      skip: query.skip,
      limit: query.limit
    });

    if (collectionName) {
      syncQuery.equalTo('collection', collectionName);
    }

    return syncQuery;
  }

  return undefined;
}

export class Sync {
  public collectionName: string;
  public tag?: string;

  constructor(collectionName: string, tag?: string) {
    this.collectionName = collectionName;
    this.tag = tag;
  }

  isPushInProgress() {
    return pushInProgress.get(this.collectionName) === true;
  }

  find(query?: Query) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.find(query);
  }

  findById(id: string) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.findById(id);
  }

  count(query?: Query) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.count(query);
  }

  addCreateSyncEvent(docs: any) {
    return this.addSyncEvent(SyncEvent.Create, docs);
  }

  addUpdateSyncEvent(docs: any) {
    return this.addSyncEvent(SyncEvent.Update, docs);
  }

  addDeleteSyncEvent(docs: any) {
    return this.addSyncEvent(SyncEvent.Delete, docs);
  }

  async addSyncEvent(event: SyncEvent, docs: any) {
    const syncCache = new SyncCache(this.tag);
    let singular = false;
    let syncDocs: any = [];
    let docsToSync = docs;

    if (!Array.isArray(docs)) {
      singular = true;
      docsToSync = [docs];
    }

    if (docsToSync.length > 0) {
      const docWithNoId = docsToSync.find((doc: { _id: any; }) => !doc._id);
      if (docWithNoId) {
        throw new SyncError('A doc is missing an _id. All docs must have an _id in order to be added to the sync collection.');
      }

      // Remove existing sync events that match the docs
      const query = new Query().contains('entityId', docsToSync.map((doc: { _id: any; }) => doc._id));
      await this.remove(query);

      // Don't add delete events for docs that were created offline
      if (event === SyncEvent.Delete) {
        docsToSync = docsToSync.filter((doc: { _kmd: { local: boolean; }; }) => {
          if (doc._kmd && doc._kmd.local === true) {
            return false;
          }

          return true;
        });
      }

      // Add sync events for the docs
      syncDocs = await syncCache.save(docsToSync.map((doc: { _id: any; }) => {
        return {
          entityId: doc._id,
          entity: doc,
          collection: this.collectionName,
          state: {
            operation: event
          }
        };
      }));
    }

    return singular ? syncDocs.shift() : syncDocs;
  }

  async push(query?: Query, options?: any) {
    const network = new NetworkStore(this.collectionName);
    const cache = new DataStoreCache(this.collectionName, this.tag);
    const syncCache = new SyncCache(this.tag);

    if (this.isPushInProgress()) {
      throw new SyncError('Data is already being pushed to the backend. Please wait for it to complete before pushing new data to the backend.');
    }

    const batchSize = 100;
    const syncDocs = await syncCache.find(query);

    if (syncDocs.length > 0) {
      let i = 0;

      const batchPush = async (pushResults: any = []): Promise<any> => {
        markPushStart(this.collectionName);

        if (i >= syncDocs.length) {
          markPushEnd(this.collectionName);
          return pushResults;
        }

        const batch = syncDocs.slice(i, i + batchSize);
        i += batchSize;

        const results = await Promise.all(batch.map(async (syncDoc) => {
          const { _id, entityId, state = { operation: undefined } } = syncDoc;
          const event = state.operation;

          if (event === SyncEvent.Delete) {
            try {
              try {
                // Remove the doc from the backend
                await network.removeById(entityId, options);
              } catch (error) {
                // Rethrow the error if it is not a NotFoundError
                if (!(error instanceof NotFoundError)) {
                  throw error;
                }
              }

              // Remove the sync doc
              await syncCache.removeById(_id!);

              // Return a result
              return {
                _id: entityId,
                operation: event
              };
            } catch (error) {
              // Return a result with the error
              return {
                _id: entityId,
                operation: event,
                error
              };
            }
          } else if (event === SyncEvent.Create || event === SyncEvent.Update) {
            let doc: any = await cache.findById(entityId);
            let local = false;

            try {
              // Save the doc to the backend
              if (event === SyncEvent.Create) {
                if (doc._kmd && doc._kmd.local === true) {
                  local = true;
                  // tslint:disable-next-line:no-delete
                  delete doc._id;
                  // tslint:disable-next-line:no-delete
                  delete doc._kmd.local;
                }

                doc = await network.create(doc, options);
              } else {
                doc = await network.update(doc, options);
              }

              // Remove the sync doc
              await syncCache.removeById(_id!);

              // Save the doc to cache
              await cache.save(doc);

              // Remove the original doc that was created
              if (local) {
                await cache.removeById(entityId);
              }

              // Return a result
              return {
                _id: entityId,
                operation: event,
                entity: doc
              };
            } catch (error) {
              // Return a result with the error
              return {
                _id: entityId,
                operation: event,
                entity: doc,
                error
              };
            }
          }

          // Return a default result
          return {
            _id,
            operation: event,
            error: new Error('Unable to push item in sync table because the event was not recognized.')
          };
        }));

        markPushEnd(this.collectionName);

        // Push remaining docs
        return batchPush(pushResults.concat(results));
      };

      return batchPush();
    }

    return [];
  }

  async remove(query?: Query) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.remove(query);
  }

  async removeById(id: string) {
    const syncCache = new SyncCache(this.tag);
    return syncCache.removeById(id);
  }

  async clear() {
    const syncCache = new SyncCache(this.tag);
    return syncCache.remove();
  }
}
