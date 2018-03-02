import nock from 'nock';
import expect from 'expect';
import chai from 'chai';
import cloneDeep from 'lodash/cloneDeep';
import { SyncOperation, syncManagerProvider } from './sync';
import { SyncStore } from './syncstore';
import { SyncError } from '../errors';
import { randomString } from '../utils';
import { Query } from '../query';
import { NetworkRack } from '../request';
import { NodeHttpMiddleware } from '../../node/http';
import { User } from '../user';
import { init } from '../kinvey';
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
    NetworkRack.useHttpMiddleware(new NodeHttpMiddleware({}));
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
    const password = randomString();
    const reply = {
      _id: randomString(),
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString(),
        authtoken: randomString()
      },
      username: username,
      _acl: {
        creator: randomString()
      }
    };

    nock(client.apiHostname)
      .post(`/user/${client.appKey}/login`, { username: username, password: password })
      .reply(200, reply);

    return User.login(username, password);
  });

  afterEach(() => {
    const manager = syncManagerProvider.getSyncManager();
    return manager.clearSync(collection);
  });

  describe('counting sync items', () => {
    const entity1 = { _id: randomString() };
    const entity2 = { _id: randomString() };

    beforeEach(() => {
      const store = new SyncStore(collection);
      return store.save(entity1);
    });

    beforeEach(() => {
      const store = new SyncStore(collection);
      return store.save(entity2);
    });

    it('should return the count for all entities that need to be synced', () => {
      const manager = syncManagerProvider.getSyncManager();
      return manager.getSyncItemCount(collection)
        .then((count) => {
          expect(count).toEqual(2);
        });
    });

    it('should return the count for all entities that match the query that need to be synced', () => {
      const manager = syncManagerProvider.getSyncManager();
      const query = new Query().equalTo('_id', entity1._id);
      return manager.getSyncItemCountByEntityQuery(collection, query)
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('addCreateEvent()', () => {
    it('should throw an error when an entity does not contain and _id', () => {
      const collection = randomString();
      const manager = syncManagerProvider.getSyncManager();
      return manager.addCreateEvent(collection, { prop: randomString() })
        .then(() => {
          throw new Error('This test should fail.');
        })
        .catch((error) => {
          expect(error).toBeA(SyncError);
        });
    });

    it('should accept a single entity', () => {
      const entity = { _id: randomString() };
      const manager = syncManagerProvider.getSyncManager();
      return manager.addCreateEvent(collection, entity)
        .then((syncEntity) => {
          expect(syncEntity).toEqual(entity);
        });
    });

    it('should accept an array of entities', () => {
      const entities = [{ _id: randomString() }];
      const manager = syncManagerProvider.getSyncManager();
      return manager.addCreateEvent(collection, entities)
        .then((syncEntities) => {
          expect(syncEntities).toEqual(entities);
        });
    });

    it('should add entities to the sync table', () => {
      const entity = { _id: randomString() };
      const store = new SyncStore(collection);
      return store.create(entity)
        .then(() => {
          const manager = syncManagerProvider.getSyncManager();
          return manager.getSyncItemCount(collection);
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('addUpdateEvent()', () => {
    it('should throw an error when an entity does not contain and _id', () => {
      const collection = randomString();
      const manager = syncManagerProvider.getSyncManager();
      return manager.addUpdateEvent(collection, { prop: randomString() })
        .then(() => {
          throw new Error('This test should fail.');
        })
        .catch((error) => {
          expect(error).toBeA(SyncError);
        });
    });

    it('should accept a single entity', () => {
      const entity = { _id: randomString() };
      const manager = syncManagerProvider.getSyncManager();
      return manager.addUpdateEvent(collection, entity)
        .then((syncEntity) => {
          expect(syncEntity).toEqual(entity);
        });
    });

    it('should accept an array of entities', () => {
      const entities = [{ _id: randomString() }];
      const manager = syncManagerProvider.getSyncManager();
      return manager.addUpdateEvent(collection, entities)
        .then((syncEntities) => {
          expect(syncEntities).toEqual(entities);
        });
    });

    it('should add entities to the sync table', () => {
      const entity = { _id: randomString() };
      const store = new SyncStore(collection);
      return store.update(entity)
        .then(() => {
          const manager = syncManagerProvider.getSyncManager();
          return manager.getSyncItemCount(collection);
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('addDeleteEvent', () => {
    it('should throw an error when an entity does not contain and _id', () => {
      const collection = randomString();
      const manager = syncManagerProvider.getSyncManager();
      return manager.addDeleteEvent(collection, { prop: randomString() })
        .then(() => {
          throw new Error('This test should fail.');
        })
        .catch((error) => {
          expect(error).toBeA(SyncError);
        });
    });

    it('should accept a single entity', () => {
      const entity = { _id: randomString() };
      const manager = syncManagerProvider.getSyncManager();
      return manager.addDeleteEvent(collection, entity)
        .then((syncEntity) => {
          expect(syncEntity).toEqual(entity);
        });
    });

    it('should accept an array of entities', () => {
      const entities = [{ _id: randomString() }];
      const manager = syncManagerProvider.getSyncManager();
      return manager.addDeleteEvent(collection, entities)
        .then((syncEntities) => {
          expect(syncEntities).toEqual(entities);
        });
    });

    it('should add entities to the sync table', () => {
      const entity = { _id: randomString() };
      const store = new SyncStore(collection);
      return store.save(entity)
        .then(() => {
          return store.removeById(entity._id);
        })
        .then(() => {
          const manager = syncManagerProvider.getSyncManager();
          return manager.getSyncItemCount(collection);
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('pull()', () => {
    it('should return entities from the backend', () => {
      const entity = { _id: randomString() };
      const manager = syncManagerProvider.getSyncManager();

      // Kinvey API Response
      nock(client.apiHostname)
        .get(backendPathname, () => true)
        .query(true)
        .reply(200, [entity]);

      return manager.pull(collection)
        .then((entities) => {
          expect(entities).toBe(1);
        });
    });
  });

  describe('push()', () => {
    before(() => nock.cleanAll());

    beforeEach(() => {
      const store = new SyncStore(collection);
      return store.clear();
    });

    it('should execute pending sync operations', () => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      let entity3 = {};
      const entity3Id = randomString();
      const manager = syncManagerProvider.getSyncManager();
      const store = new SyncStore(collection);

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

          return manager.push(collection);
        })
        .then((result) => {
          expect(result).toEqual([
            { _id: entity2._id, operation: SyncOperation.Delete },
            { _id: entity1._id, operation: SyncOperation.Update, entity: simulatePreSaveBLHook(entity1) },
            { _id: entity3._id, operation: SyncOperation.Create, entity: simulatePreSaveBLHook({ _id: entity3Id }) }
          ]);
          return manager.getSyncItemCount(collection);
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
      const manager = syncManagerProvider.getSyncManager();
      const store = new SyncStore(collection);
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

          return manager.push(collection);
        })
        .then((results) => {
          expect(results.length).toBe(2);
          const updateResult = results.find(r => r.operation === SyncOperation.Update);
          const deleteResult = results.find(r => r.operation === SyncOperation.Delete);
          expect(updateResult).toIncludeKey('error');
          expect(updateResult).toInclude({ _id: entity1._id, operation: SyncOperation.Update, entity: entity1 });
          expect(deleteResult).toEqual({ _id: entity2._id, operation: SyncOperation.Delete });
          return manager.getSyncItemCount(collection);
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });

    it('should not push when an existing push is in progress', (done) => {
      const entity1 = { _id: randomString() };
      const store = new SyncStore(collection);
      const manager = syncManagerProvider.getSyncManager();
      store.save(entity1)
        .then(() => {
          // Kinvey API Response
          nock(client.apiHostname)
            .put(`${backendPathname}/${entity1._id}`, () => true)
            .query(true)
            .reply(200, entity1);

          // Sync
          manager.push(collection)
            .catch(done);

          // Add second sync operation
          const entity2 = { _id: randomString() };
          return store.save(entity2);
        })
        .then(() => {
          return manager.push(collection);
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
      const manager1 = syncManagerProvider.getSyncManager();
      const manager2 = syncManagerProvider.getSyncManager();
      const store1 = new SyncStore(collection);
      const store2 = new SyncStore(collection2);

      nock(client.apiHostname)
        .put(`${backendPathname}/${entity1._id}`, () => true)
        .delay(1000)
        .reply(200, entity1);

      nock(client.apiHostname)
        .put(`${getBackendPathnameForCollection(client, collection2)}/${entity2._id}`, () => true)
        .reply(200, entity2);

      const promise = store1.save(entity1)
        .then(() => {
          manager1.push(collection)
            .then(() => promise.should.be.fulfilled)
            // ensure we're not polluting, so other tests don't fail
            .then(() => manager1.clearSync(collection2))
            .then(() => done())
            .catch(done);

          return store2.save(entity2);
        })
        .then(() => {
          return manager2.push(collection2);
        });
    });
  });
});
