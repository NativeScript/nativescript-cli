import nock from 'nock';
import expect from 'expect';
import chai from 'chai';
import cloneDeep from 'lodash/cloneDeep';
import { SyncError } from 'kinvey-errors';
import { randomString } from 'kinvey-test-utils';
import { Query } from 'kinvey-query';
import { register as registerHttp } from 'kinvey-http-node';
import { register as registerCache } from 'kinvey-cache-memory';
import { set as setSession } from 'kinvey-session';
import { init } from 'kinvey-app';
import { CacheStore } from './cachestore';
import { Sync } from './sync';
chai.use(require('chai-as-promised'));
chai.should();
const collection = 'Books';

function getBackendPathnameForCollection(client, collection) {
  return `/appdata/${client.appKey}/${collection}`;
}

describe('Sync', () => {
  let client;
  let backendPathname;

  before(() => {
    registerHttp();
    registerCache();
  });

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString()
    });
    backendPathname = getBackendPathnameForCollection(client, collection);
  });

  before(() => {
    const username = randomString();
    const session = {
      _id: randomString(),
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString(),
        authtoken: randomString()
      },
      username: randomString(),
      _acl: {
        creator: randomString()
      }
    };
    return setSession(session);
  });

  afterEach(() => {
    const sync = new Sync(collection);
    return sync.clear();
  });

  describe('counting sync items', () => {
    const entity1 = { _id: randomString() };
    const entity2 = { _id: randomString() };

    beforeEach(() => {
      const store = new CacheStore(collection, { autoSync: false });
      return store.save(entity1);
    });

    beforeEach(() => {
      const store = new CacheStore(collection, { autoSync: false });
      return store.save(entity2);
    });

    it('should return the count for all entities that need to be synced', () => {
      const sync = new Sync(collection);
      return sync.count()
        .then((count) => {
          expect(count).toEqual(2);
        });
    });

    it('should return the count for all entities that match the query that need to be synced', () => {
      const sync = new Sync(collection);
      const query = new Query().equalTo('_id', entity1._id);
      return sync.count(query)
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('addCreateSyncEvent()', () => {
    it('should throw an error when an entity does not contain and _id', () => {
      const collection = randomString();
      const sync = new Sync(collection);
      return sync.addCreateSyncEvent({ prop: randomString() })
        .then(() => {
          throw new Error('This test should fail.');
        })
        .catch((error) => {
          expect(error).toBeA(SyncError);
        });
    });

    it('should accept a single entity', () => {
      const entity = { _id: randomString() };
      const sync = new Sync(collection);
      return sync.addCreateSyncEvent(entity)
        .then((syncEntity) => {
          expect(syncEntity).toEqual({
            _id: entity._id,
            entityId: entity._id,
            collection,
            state: {
              operation: 'POST'
            }
          });
        });
    });

    it('should accept an array of entities', () => {
      const entities = [{ _id: randomString() }];
      const sync = new Sync(collection);
      return sync.addCreateSyncEvent(entities)
        .then((syncEntities) => {
          expect(syncEntities).toEqual([{
            _id: entities[0]._id,
            entityId: entities[0]._id,
            collection,
            state: {
              operation: 'POST'
            }
          }]);
        });
    });

    it('should add entities to the sync table', () => {
      const entity = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: false });
      return store.create(entity)
        .then(() => {
          const sync = new Sync(collection);
          return sync.count();
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('addUpdateSyncEvent()', () => {
    it('should throw an error when an entity does not contain and _id', () => {
      const collection = randomString();
      const sync = new Sync(collection);
      return sync.addUpdateSyncEvent({ prop: randomString() })
        .then(() => {
          throw new Error('This test should fail.');
        })
        .catch((error) => {
          expect(error).toBeA(SyncError);
        });
    });

    it('should accept a single entity', () => {
      const entity = { _id: randomString() };
      const sync = new Sync(collection);
      return sync.addUpdateSyncEvent(entity)
        .then((syncEntity) => {
          expect(syncEntity).toEqual({
            _id: entity._id,
            entityId: entity._id,
            collection,
            state: {
              operation: 'PUT'
            }
          });
        });
    });

    it('should accept an array of entities', () => {
      const entities = [{ _id: randomString() }];
      const sync = new Sync(collection);
      return sync.addUpdateSyncEvent(entities)
        .then((syncEntities) => {
          expect(syncEntities).toEqual([{
            _id: entities[0]._id,
            entityId: entities[0]._id,
            collection,
            state: {
              operation: 'PUT'
            }
          }]);
        });
    });

    it('should add entities to the sync table', () => {
      const entity = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: false });
      return store.update(entity)
        .then(() => {
          const sync = new Sync(collection);
          return sync.count();
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('addDeleteSyncEvent', () => {
    it('should throw an error when an entity does not contain and _id', () => {
      const collection = randomString();
      const sync = new Sync(collection);
      return sync.addDeleteSyncEvent({ prop: randomString() })
        .then(() => {
          throw new Error('This test should fail.');
        })
        .catch((error) => {
          expect(error).toBeA(SyncError);
        });
    });

    it('should accept a single entity', () => {
      const entity = { _id: randomString() };
      const sync = new Sync(collection);
      return sync.addDeleteSyncEvent(entity)
        .then((syncEntity) => {
          expect(syncEntity).toEqual({
            _id: entity._id,
            entityId: entity._id,
            collection,
            state: {
              operation: 'DELETE'
            }
          });
        });
    });

    it('should accept an array of entities', () => {
      const entities = [{ _id: randomString() }];
      const sync = new Sync(collection);
      return sync.addDeleteSyncEvent(entities)
        .then((syncEntities) => {
          expect(syncEntities).toEqual([{
            _id: entities[0]._id,
            entityId: entities[0]._id,
            collection,
            state: {
              operation: 'DELETE'
            }
          }]);
        });
    });

    it('should add entities to the sync table', () => {
      const entity = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: false });
      return store.save(entity)
        .then(() => {
          return store.removeById(entity._id);
        })
        .then(() => {
          const sync = new Sync(collection);
          return sync.count();
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('pull()', () => {
    it('should return entities from the backend', () => {
      const entity = { _id: randomString() };
      const sync = new Sync(collection);

      // Kinvey API Response
      nock(client.apiHostname)
        .get(backendPathname, () => true)
        .query(true)
        .reply(200, [entity]);

      return sync.pull()
        .then((entities) => {
          expect(entities).toBe(1);
        });
    });

    it('should add kinveyfile_ttl query parameter', () => {
      const sync = new Sync(collection);
      const entity1 = { _id: randomString() };

      nock(client.apiHostname)
        .get(backendPathname)
        .query({ kinveyfile_ttl: 3600 })
        .reply(200, [entity1]);

      return sync.pull(null, { kinveyFileTTL: 3600 })
        .then((entities) => {
          expect(entities).toBe(1);
        });
    });

    it('should add kinveyfile_tls query parameter', () => {
      const sync = new Sync(collection);
      const entity1 = { _id: randomString() };

      nock(client.apiHostname)
        .get(backendPathname)
        .query({ kinveyfile_tls: true })
        .reply(200, [entity1]);

      return sync.pull(null, { kinveyFileTLS: true })
        .then((entities) => {
          expect(entities).toBe(1);
        });
    });
  });

  describe('push()', () => {
    before(() => nock.cleanAll());

    beforeEach(() => {
      const store = new CacheStore(collection, { autoSync: false });
      return store.clear();
    });

    it('should remove _kmd.local for a locally created entity', async () => {
      const entityId = randomString();
      const store = new CacheStore(collection, { autoSync: false });
      const entity = await store.save({});

      const response = { _id: entityId };
      nock(client.apiHostname)
        .post(backendPathname, { _kmd: {} })
        .reply(200, response);

      const result = (await store.push()).shift();
      expect(result).toEqual({
        _id: entity._id,
        operation: 'POST',
        entity: response
      });
    });

    it('should execute pending sync operations', () => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      let entity3 = {};
      const entity3Id = randomString();
      const sync = new Sync(collection);
      const store = new CacheStore(collection, { autoSync: false });

      const simulatePreSaveBLHook = (entity) => {
        const clone = cloneDeep(entity);
        clone.someNewProperty = true;
        return clone;
      };

      return store.save(entity1)
        .then(() => store.save(entity2))
        .then(() => store.save(entity3))
        .then(entity => {
          entity3 = entity;
        })
        .then(() => store.removeById(entity2._id))
        .then(() => {
          nock(client.apiHostname)
            .put(`${backendPathname}/${entity1._id}`, () => true)
            .reply(200, () => simulatePreSaveBLHook(entity1));

          nock(client.apiHostname)
            .delete(`${backendPathname}/${entity2._id}`, () => true)
            .reply(200, { count: 1 });

          nock(client.apiHostname)
            .post(backendPathname, () => true)
            .reply(200, simulatePreSaveBLHook({ _id: entity3Id }));

          return sync.push();
        })
        .then((result) => {
          expect(result).toEqual([
            { _id: entity1._id, operation: 'PUT', entity: simulatePreSaveBLHook(entity1) },
            { _id: entity3._id, operation: 'POST', entity: simulatePreSaveBLHook({ _id: entity3Id }) },
            { _id: entity2._id, operation: 'DELETE' }
          ]);
          return sync.count();
        })
        .then((count) => {
          expect(count).toEqual(0);
          return store.find().toPromise();
        })
        .then((offlineEntities) => {
          offlineEntities.forEach((entity) => {
            expect(entity.someNewProperty).toBe(true);
          });
          expect(nock.pendingMocks().length).toEqual(0);
        });
    });

    it('should not stop syncing if one entity results in an error', () => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const sync = new Sync(collection);
      const store = new CacheStore(collection, { autoSync: false });
      return store.save(entity1)
        .then(() => store.save(entity2))
        .then(() => store.removeById(entity2._id))
        .then(() => {
          nock(client.apiHostname)
            .put(`${backendPathname}/${entity1._id}`, () => true)
            .query(true)
            .reply(500);

          nock(client.apiHostname)
            .delete(`${backendPathname}/${entity2._id}`, () => true)
            .query(true)
            .reply(200, { count: 1 });

          return sync.push();
        })
        .then((results) => {
          expect(results.length).toBe(2);
          const updateResult = results.find(r => r.operation === 'PUT');
          const deleteResult = results.find(r => r.operation === 'DELETE');
          expect(updateResult).toIncludeKey('error');
          expect(updateResult).toInclude({ _id: entity1._id, operation: 'PUT', entity: entity1 });
          expect(deleteResult).toEqual({ _id: entity2._id, operation: 'DELETE' });
          return sync.count();
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });

    it('should not push when an existing push is in progress', (done) => {
      const entity1 = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: false });
      const sync = new Sync(collection);
      store.save(entity1)
        .then(() => {
          // Kinvey API Response
          nock(client.apiHostname)
            .put(`${backendPathname}/${entity1._id}`, () => true)
            .query(true)
            .reply(200, entity1);

          // Sync
          sync.push()
            .catch(done);

          // Add second sync operation
          const entity2 = { _id: randomString() };
          return store.save(entity2);
        })
        .then(() => {
          return sync.push();
        })
        .catch((err) => {
          expect(err).toExist();
          expect(err.message).toEqual('Data is already being pushed to the backend.'
            + ' Please wait for it to complete before pushing new data to the backend.');
          done();
        })
        .catch(done);
    });

    it('should push when an existing push is in progress on a different collection', (done) => {
      const collection2 = randomString();
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const sync1 = new Sync(collection);
      const sync2 = new Sync(collection2);
      const store1 = new CacheStore(collection, { autoSync: false });
      const store2 = new CacheStore(collection2, { autoSync: false });

      nock(client.apiHostname)
        .put(`${backendPathname}/${entity1._id}`, () => true)
        .delay(1000)
        .reply(200, entity1);

      nock(client.apiHostname)
        .put(`${getBackendPathnameForCollection(client, collection2)}/${entity2._id}`, () => true)
        .reply(200, entity2);

      const promise = store1.save(entity1)
        .then(() => {
          sync1.push()
            .then(() => promise.should.be.fulfilled)
            // ensure we're not polluting, so other tests don't fail
            .then(() => sync1.clear())
            .then(() => done())
            .catch(done);

          return store2.save(entity2);
        })
        .then(() => {
          return sync2.push();
        });
    });
  });
});
