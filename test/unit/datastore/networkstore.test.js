import nock from 'nock';
import expect from 'expect';

import Query from 'src/query';
import Aggregation from 'src/aggregation';
import { KinveyError, NotFoundError, ServerError } from 'src/errors';
import { randomString } from 'src/utils';
import { NetworkStore, SyncStore } from 'src/datastore';

import { mockRequiresIn } from '../mocks';

const collection = 'Books';

describe('NetworkStore', function () {
  describe('pathname', function () {
    it(`should equal /appdata/<appkey>/${collection}`, function () {
      const store = new NetworkStore(collection);
      expect(store.pathname).toEqual(`/appdata/${store.client.appKey}/${collection}`);
    });

    it('should not be able to be changed', function () {
      expect(() => {
        const store = new NetworkStore(collection);
        store.pathname = `/tests/${collection}`;
      }).toThrow();
    });
  });

  describe('find()', function () {
    it('should throw an error if the query argument is not an instance of the Query class', function (done) {
      const store = new NetworkStore(collection);
      store.find({})
        .subscribe(null, (error) => {
          try {
            expect(error).toBeA(KinveyError);
            expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return all the entities from the backend', function () {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(this.client.apiHostname)
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      const store = new NetworkStore(collection);
      return store.find().toPromise()
        .then((entities) => {
          expect(entities).toEqual([entity1, entity2]);
        });
    });

    it('should find the entities that match the query', function () {
      const store = new NetworkStore();
      const entity1 = { _id: randomString() };
      const query = new Query();
      query.equalTo('_id', entity1._id);

      nock(this.client.apiHostname)
        .get(store.pathname)
        .query({ query: JSON.stringify({ _id: entity1._id }) })
        .reply(200, [entity1]);

      return store.find(query).toPromise()
        .then((entities) => {
          expect(entities).toEqual([entity1]);
        });
    });
  });

  describe('findById()', function () {
    it('should throw a NotFoundError if the id argument does not exist', function () {
      const entityId = 1;
      nock(this.client.apiHostname)
        .get(`/appdata/${this.client.appKey}/${collection}/${entityId}`)
        .reply(404);

      const store = new NetworkStore(collection);
      return store.findById(entityId).toPromise()
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
        });
    });

    it('should return the entity that matches the id argument', function () {
      const entityId = randomString();
      const entity1 = { _id: entityId };

      nock(this.client.apiHostname)
        .get(`/appdata/${this.client.appKey}/${collection}/${entityId}`)
        .reply(200, entity1);

      const store = new NetworkStore(collection);
      return store.findById(entityId).toPromise()
        .then((entity) => {
          expect(entity).toEqual(entity1);
        });
    });
  });

  describe('group()', function () {
    it('should throw an error for an invlad aggregation', function () {
      const store = new NetworkStore(collection);
      return store.group({}).toPromise()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid aggregation. It must be an instance of the Aggregation class.');
        });
    });

    it('should throw a ServerError', function () {
      nock(this.client.apiHostname)
        .post(`/appdata/${this.client.appKey}/${collection}/_group`)
        .reply(500);

      const store = new NetworkStore(collection);
      const aggregation = Aggregation.count('title');
      return store.group(aggregation).toPromise()
        .catch((error) => {
          expect(error).toBeA(ServerError);
          expect(error.message).toEqual('An error occurred on the server.');
        });
    });

    it('should return the count of all unique properties on the collection', function () {
      const reply = [{ title: randomString(), count: 2 }, { title: randomString(), count: 1 }];
      nock(this.client.apiHostname)
        .post(`/appdata/${this.client.appKey}/${collection}/_group`)
        .reply(200, reply);

      const store = new NetworkStore(collection);
      const aggregation = Aggregation.count('title');
      return store.group(aggregation).toPromise()
        .then((result) => {
          expect(result).toBeA(Array);
          expect(result).toEqual(reply);
        });
    });
  });

  describe('count()', function () {
    it('should throw an error for an invalid query', function () {
      const store = new NetworkStore(collection);
      return store.count({}).toPromise()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
        });
    });

    it('should throw a ServerError', function () {
      nock(this.client.apiHostname)
        .get(`/appdata/${this.client.appKey}/${collection}/_count`)
        .reply(500);

      const store = new NetworkStore(collection);
      return store.count().toPromise()
        .catch((error) => {
          expect(error).toBeA(ServerError);
          expect(error.message).toEqual('An error occurred on the server.');
        });
    });

    it('should return the count for the collection', function () {
      nock(this.client.apiHostname)
        .get(`/appdata/${this.client.appKey}/${collection}/_count`)
        .reply(200, { count: 1 });

      const store = new NetworkStore(collection);
      return store.count().toPromise()
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('create()', function () {
    it('should throw an error if trying to create an array of entities', async function () {
      const store = new NetworkStore(collection);
      const entity1 = {
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };
      const entity2 = {
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };

      return store.create([entity1, entity2])
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Unable to create an array of entities.');
        });
    });

    it('should create an entity', async function () {
      const store = new NetworkStore(collection);
      const entity = {
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };
      const reply = {
        _id: randomString(),
        title: entity.title,
        author: entity.author,
        summary: entity.summary
      };

      nock(this.client.apiHostname)
        .post(`/appdata/${this.client.appKey}/${collection}`, entity)
        .reply(201, reply);

      return store.create(entity)
        .then((createdEntity) => {
          expect(createdEntity).toEqual(reply);

          // Check the cache to make sure the entity was
          // not stored in the cache
          const syncStore = new SyncStore(collection);
          const query = new Query();
          query.equalTo('_id', createdEntity._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should create an entity if it contains an _id', async function () {
      const store = new NetworkStore(collection);
      const entity = {
        _id: randomString(),
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };

      nock(this.client.apiHostname)
        .post(`/appdata/${this.client.appKey}/${collection}`, entity)
        .reply(201, entity);

      return store.create(entity)
        .then((createdEntity) => {
          expect(createdEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // not stored in the cache
          const syncStore = new SyncStore(collection);
          const query = new Query();
          query.equalTo('_id', createdEntity._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });
  });

  describe('update()', function () {
    it('should throw an error if trying to update an array of entities', async function () {
      const store = new NetworkStore(collection);
      const entity1 = {
        _id: randomString(),
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };
      const entity2 = {
        _id: randomString(),
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };

      return store.update([entity1, entity2])
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Unable to update an array of entities.');
        });
    });

    it('should throw an error if an entity does not have an _id', async function () {
      const store = new NetworkStore(collection);
      const entity = {
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };

      return store.update(entity)
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Unable to update entity.');
        });
    });

    it('should update an entity with an _id', async function () {
      const store = new NetworkStore(collection);
      const entity = {
        _id: randomString(),
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };
      nock(this.client.apiHostname)
        .put(`/appdata/${this.client.appKey}/${collection}/${entity._id}`, entity)
        .reply(200, entity);

      return store.update(entity)
        .then((updatedEntity) => {
          expect(updatedEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // not stored in the cache
          const syncStore = new SyncStore(collection);
          const query = new Query();
          query.equalTo('_id', updatedEntity._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });
  });

  describe('save()', function () {
    afterEach(function () {
      expect.restoreSpies();
    });

    it('should call create() for an entity that does not contain an _id', function () {
      const store = new NetworkStore(collection);
      const spy = expect.spyOn(store, 'create');
      store.save({});
      expect(spy).toHaveBeenCalled();
    });

    it('should call update() for an entity that contains an _id', function () {
      const store = new NetworkStore(collection);
      const spy = expect.spyOn(store, 'update');
      store.save({ _id: randomString() });
      expect(spy).toHaveBeenCalled();
    });

    it('should call create() when an array of entities is provided', function () {
      const store = new NetworkStore(collection);
      const spy = expect.spyOn(store, 'create');
      store.save([{ _id: randomString() }, {}]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('remove()', function () {
    it('should throw an error for an invalid query', function () {
      const store = new NetworkStore(collection);
      return store.remove({})
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
        });
    });

    it('should throw a ServerError', function () {
      nock(this.client.apiHostname)
        .delete(`/appdata/${this.client.appKey}/${collection}`)
        .reply(500);

      const store = new NetworkStore(collection);
      return store.remove()
        .catch((error) => {
          expect(error).toBeA(ServerError);
          expect(error.message).toEqual('An error occurred on the server.');
        });
    });

    it('should remove all entities from the cache', function () {
      const reply = { count: 2 };

      nock(this.client.apiHostname)
        .delete(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, reply);

      const store = new NetworkStore(collection);
      return store.remove()
        .then((result) => {
          expect(result).toEqual(reply);
        });
    });
  });

  describe('removeById()', function () {
    it('should throw a NotFoundError if the id argument does not exist', function () {
      const store = new NetworkStore(collection);
      const _id = randomString();

      nock(this.client.apiHostname)
        .delete(`/appdata/${this.client.appKey}/${collection}/${_id}`)
        .reply(404);

      return store.removeById(_id)
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
        });
    });

    it('should remove the entity that matches the id argument', function () {
      const store = new NetworkStore(collection);
      const _id = randomString();
      const reply = { count: 1 };

      nock(this.client.apiHostname)
        .delete(`/appdata/${this.client.appKey}/${collection}/${_id}`)
        .reply(200, reply);

      return store.removeById(_id)
        .then((response) => {
          expect(response).toEqual(reply);
        });
    });
  });

  describe('when working with live service', () => {
    const path = '../../../src/datastore/src/networkstore';
    const managerMock = {
      subscribeCollection: () => { },
      unsubscribeCollection: () => { }
    };
    const requireMocks = {
      '../../live': { getLiveCollectionManager: () => managerMock }
    };

    /** @type {NetworkStore} */
    let proxiedStore;

    beforeEach(() => {
      const ProxiedNetworkStore = mockRequiresIn(__dirname, path, requireMocks, 'default');
      proxiedStore = new ProxiedNetworkStore(collection);
    });

    afterEach(() => expect.restoreSpies());

    describe('subscribe()', () => {
      it('should call subscribeCollection() method of LiveCollectionManager class', () => {
        const spy = expect.spyOn(managerMock, 'subscribeCollection');
        const handler = { onMessage: () => { } };
        proxiedStore.subscribe(handler);
        expect(spy).toHaveBeenCalledWith(collection, handler);
      });
    });

    describe('unsubscribe()', () => {
      it('should call unsubscribeCollection() method of LiveCollectionManager class', () => {
        const spy = expect.spyOn(managerMock, 'unsubscribeCollection');
        proxiedStore.unsubscribe();
        expect(spy).toHaveBeenCalledWith(collection);
      });
    });
  });
});
