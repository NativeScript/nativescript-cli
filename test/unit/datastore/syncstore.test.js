import { SyncStore, SyncOperation } from 'src/datastore';
import Aggregation from 'src/aggregation';
import Query from 'src/query';
import { KinveyError, NotFoundError } from 'src/errors';
import { randomString } from 'src/utils';
import nock from 'nock';
import expect from 'expect';
const collection = 'Books';

describe('SyncStore', function() {
  afterEach(function() {
    const store = new SyncStore(collection);
    return store.clear();
  });

  describe('pathname', function() {
    it(`should equal /appdata/<appkey>/${collection}`, function() {
      const store = new SyncStore(collection);
      expect(store.pathname).toEqual(`/appdata/${this.client.appKey}/${collection}`);
    });

    it('should not be able to be changed', function() {
      expect(() => {
        const store = new SyncStore(collection);
        store.pathname = `/tests/${collection}`;
      }).toThrow();
    });
  });

  describe('syncAutomatically', function() {
    it('should be true', function() {
      const store = new SyncStore(collection);
      expect(store.syncAutomatically).toEqual(false);
    });

    it('should not be able to be changed', function() {
      expect(() => {
        const store = new SyncStore(collection);
        store.syncAutomatically = true;
      }).toThrow();
    });
  });

  describe('find()', function() {
    it('should throw an error if the query argument is not an instance of the Query class', function(done) {
      const store = new SyncStore(collection);
      store.find({})
        .subscribe(null, (error) => {
          try {
            expect(error).toBeA(KinveyError);
            expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
            done();
          } catch (e) {
            done(e);
          }
        }, () => {
          done(new Error('This test should fail.'));
        });
    });

    it('should return the entities', function(done) {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new SyncStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          store.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(1);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });

    it('should return the entities that match the query', function(done) {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new SyncStore(collection);
      const query = new Query().equalTo('_id', entity1._id);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          store.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(1);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1]]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });
  });

  describe('findById()', function() {
    it('should return undefined if an id is not provided', function(done) {
      const store = new SyncStore(collection);
      const onNextSpy = expect.createSpy();
      store.findById()
        .subscribe(onNextSpy, done, () => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy.calls[0].arguments).toEqual([undefined]);
            done();
          } catch (error) {
            done(error);
          }
        });
    });

    it('should throw a NotFoundError if the entity does not exist', function(done) {
      const entity = { _id: randomString() };
      const store = new SyncStore(collection);
      const onNextSpy = expect.createSpy();

      store.findById(entity._id)
        .subscribe(onNextSpy, (error) => {
          try {
            expect(onNextSpy.calls.length).toEqual(0);
            expect(error).toBeA(NotFoundError);
            done();
          } catch (e) {
            done(e);
          }
        }, () => {
          done(new Error('This test should fail.'));
        });
    });

    it('should return the entity that matches the id', function(done) {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new SyncStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          store.findById(entity1._id)
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(1);
                expect(onNextSpy.calls[0].arguments).toEqual([entity1]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });
  });

  describe('group()', function() {
    it('should throw an error if the query argument is not an instance of the Query class', function(done) {
      const store = new SyncStore(collection);
      store.group({})
        .subscribe(null, (error) => {
          try {
            expect(error).toBeA(KinveyError);
            expect(error.message).toEqual('Invalid aggregation. It must be an instance of the Aggregation class.');
            done();
          } catch (e) {
            done(e);
          }
        }, () => {
          done(new Error('This test should fail.'));
        });
    });

    it('should return the count of all unique properties on the collection', function(done) {
      const entity1 = { _id: randomString(), title: randomString() };
      const entity2 = { _id: randomString(), title: randomString() };
      const store = new SyncStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const aggregation = Aggregation.count('title');
          store.group(aggregation)
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(1);
                expect(onNextSpy.calls[0].arguments).toEqual([[{ count: 1, title: entity1.title }, { count: 1, title: entity2.title }]]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });
  });

  describe('count()', function() {
    it('should throw an error if the query argument is not an instance of the Query class', function(done) {
      const store = new SyncStore(collection);
      store.count({})
        .subscribe(null, (error) => {
          try {
            expect(error).toBeA(KinveyError);
            expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
            done();
          } catch (e) {
            done(e);
          }
        }, () => {
          done(new Error('This test should fail.'));
        });
    });

    it('should return the count for the collection', function(done) {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new SyncStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          store.count()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(1);
                expect(onNextSpy.calls[0].arguments).toEqual([2]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });
  });

  describe('create()', function() {
    it('should throw an error if trying to create an array of entities', function() {
      const store = new SyncStore(collection);
      const entity1 = {};
      const entity2 = {};

      return store.create([entity1, entity2])
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Unable to create an array of entities.');
        });
    });

    it('should create an entity', function() {
      const store = new SyncStore(collection);
      const entity = {};
      return store.create(entity)
        .then((createdEntity) => {
          expect(createdEntity).toIncludeKey('_id');
          expect(createdEntity.title).toEqual(entity.title);

          // Check the cache to make sure the entity was
          // stored in the cache
          const query = new Query();
          query.equalTo('_id', createdEntity._id);
          return store.find(query).toPromise()
            .then((entities) => {
              expect(entities).toEqual([createdEntity]);
              return store.pendingSyncCount();
            })
            .then((count) => {
              expect(count).toEqual(1);
            });
        });
    });

    it('should create an entity if it contains an _id', async function() {
      const store = new SyncStore(collection);
      const entity = { _id: randomString() };
      return store.create(entity)
        .then((createdEntity) => {
          expect(createdEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const query = new Query();
          query.equalTo('_id', createdEntity._id);
          return store.find(query).toPromise()
            .then((entities) => {
              expect(entities).toEqual([createdEntity]);
              return store.pendingSyncCount();
            })
            .then((count) => {
              expect(count).toEqual(1);
            });
        });
    });
  });

  describe('update()', function() {
    it('should throw an error if trying to update an array of entities', async function() {
      const store = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      return store.update([entity1, entity2])
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Unable to update an array of entities.');
        });
    });

    it('should throw an error if an entity does not have an _id', async function() {
      const store = new SyncStore(collection);
      const entity = {};

      return store.update(entity)
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('The entity provided does not contain an _id. An _id is required to update the entity.');
          expect(error.debug).toEqual(entity);
        });
    });

    it('should update an entity with an _id', async function() {
      const store = new SyncStore(collection);
      const entity = { _id: randomString() };
      return store.update(entity)
        .then((updatedEntity) => {
          expect(updatedEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const query = new Query();
          query.equalTo('_id', updatedEntity._id);
          return store.find(query).toPromise()
            .then((entities) => {
              expect(entities).toEqual([updatedEntity]);
              return store.pendingSyncCount();
            })
            .then((count) => {
              expect(count).toEqual(1);
            });
        });
    });
  });

  describe('save()', function() {
    afterEach(function () {
      expect.restoreSpies();
    });

    it('should call create() for an entity that does not contain an _id', function() {
      const store = new SyncStore(collection);
      const spy = expect.spyOn(store, 'create');
      store.save({});
      expect(spy).toHaveBeenCalled();
    });

    it('should call update() for an entity that contains an _id', function() {
      const store = new SyncStore(collection);
      const spy = expect.spyOn(store, 'update');
      store.save({ _id: randomString() });
      expect(spy).toHaveBeenCalled();
    });

    it('should call update() for an entity that contains an _id with special characters', function() {
      const store = new SyncStore(collection);
      const id = '.$~<>!@+_#';
      return store.save({ _id: id })
        .then((resp) => {
          expect(resp._id).toEqual(id);
        });
    });

    it('should call create() when an array of entities is provided', function() {
      const store = new SyncStore(collection);
      const spy = expect.spyOn(store, 'create');
      store.save([{ _id: randomString() }, {}]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('remove()', function() {
    it('should throw an error if the query argument is not an instance of the Query class', function() {
      const store = new SyncStore(collection);
      store.remove({})
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
        })
        .then(() => {
          throw new Error('This test should fail.');
        });
    });

    it('should return a { count: 0 } when no entities are removed', function() {
      const store = new SyncStore(collection);
      return store.remove()
        .then((result) => {
          expect(result).toEqual({ count: 0 });
        });
    });

    it('should remove all the entities', function() {
      const store = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => {
          return store.remove();
        })
        .then((result) => {
          expect(result).toEqual({ count: 2 });
          return store.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(2);
        });
    });

    it('should remove all the entities that match the query', function() {
      const store = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => {
          const query = new Query().equalTo('_id', entity1._id);
          return store.remove(query);
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          return store.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity2]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('removeById()', function() {
    it('should return a `{ count: 0 } if an id is not provided', function() {
      const store = new SyncStore(collection);
      return store.removeById()
        .then((result) => {
          expect(result).toEqual({ count: 0 });
        });
    });

    it('should remove the entity from cache if the entity is not found on the backend', function() {
      const store = new SyncStore(collection);
      const entity = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity]);

      return store.pull()
        .then(() => {
          return store.removeById(entity._id);
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const query = new Query().equalTo('_id', entity._id);
          return store.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove the entity from the cache and sync table', function() {
      const store = new SyncStore(collection);
      const entity = {};

      return store.save(entity)
        .then((entity) => {
          return store.removeById(entity._id);
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const query = new Query().equalTo('_id', entity._id);
          return store.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
          const query = new Query().equalTo('_id', entity._id);
          return store.pendingSyncCount(query);
        })
        .then((count) => {
          expect(count).toEqual(0);
        });
    });
  });

  describe('clear()', function() {
    it('should remove all entities only from the cache', function() {
      const store = new SyncStore(collection);
      const entity = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity]);

      return store.pull()
        .then(() => {
          return store.clear();
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          return store.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove only the entities from the cache that match the query', function() {
      const store = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const query = new Query().equalTo('_id', entity1._id);
          return store.clear(query);
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const query = new Query().equalTo('_id', entity1._id);
          return store.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove an entity if it was created locally and not add it to the sync queue', function() {
      const store = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const entity3 = {};

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => {
          return store.save(entity3);
        })
        .then(() => {
          return store.remove();
        })
        .then((result) => {
          expect(result).toEqual({ count: 3 });
          const syncStore = new SyncStore(collection);
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(2);
        });
    });
  });

  describe('pendingSyncCount()', function() {
    it('should return the count of entities waiting to be synced', function() {
      const store = new SyncStore(collection);
      const entity = {};

      return store.save(entity)
        .then((entity) => {
          const query = new Query().equalTo('_id', entity._id);
          return store.pendingSyncCount(query);
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('pendingSyncEntities()', function() {
    it('should return the entities waiting to be synced', function() {
      const store = new SyncStore(collection);
      const entity = {};

      return store.save(entity)
        .then((entity) => {
          const query = new Query().equalTo('_id', entity._id);
          return store.pendingSyncEntities(query)
            .then((entities) => {
              expect(entities[0]).toIncludeKey('_id');
              expect(entities[0].collection).toEqual(collection);
              expect(entities[0].entityId).toEqual(entity._id);
              expect(entities[0].state).toEqual({ operation: SyncOperation.Create });
            });
        });
    });
  });

  describe('push', function() {
    it('should push the entities to the backend', function() {
      const store = new SyncStore(collection);
      const entity = { _id: randomString() };

      return store.save(entity)
        .then(() => {
          nock(this.client.apiHostname)
            .put(`/appdata/${this.client.appKey}/${collection}/${entity._id}`, entity)
            .reply(200, entity);

          return store.push();
        })
        .then((result) => {
          expect(result).toEqual([{ _id: entity._id, operation: SyncOperation.Update, entity: entity }]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(0);
        });
    });

    it('should push only the entities matching the query to the backend', function() {
      const store = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      return store.save(entity1)
        .then(() => {
          return store.save(entity2);
        })
        .then(() => {
          nock(this.client.apiHostname)
            .put(`/appdata/${this.client.appKey}/${collection}/${entity1._id}`, entity1)
            .reply(200, entity1);

          const query = new Query().equalTo('_id', entity1._id);
          return store.push(query);
        })
        .then((result) => {
          expect(result).toEqual([{ _id: entity1._id, operation: SyncOperation.Update, entity: entity1 }]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('pull', function() {
    it('should save entities from the backend to the cache', function() {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new SyncStore(collection);

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const syncStore = new SyncStore(collection);
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity1, entity2]);
        });
    });
  });

  describe('sync', function() {
    it('should push any pending sync entities and then pull entities from the backend and save them to the cache', function() {
      const store = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      return store.save(entity1)
        .then(() => {
          nock(this.client.apiHostname)
            .put(`/appdata/${this.client.appKey}/${collection}/${entity1._id}`, entity1)
            .reply(200, entity1);

          nock(store.client.apiHostname)
            .get(`/appdata/${store.client.appKey}/${collection}`)
            .reply(200, [entity1, entity2]);

          return store.sync();
        })
        .then((result) => {
          expect(result.push).toEqual([{ _id: entity1._id, operation: SyncOperation.Update, entity: entity1 }]);
          expect(result.pull).toEqual([entity1, entity2]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(0);
        });
    });
  });

  describe('clearSync()', function() {
    it('should clear the sync table', function() {
      const store = new SyncStore(collection);
      const entity = { _id: randomString() };

      return store.save(entity)
        .then(() => {
          return store.clearSync();
        })
        .then(() => {
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(0);
          const syncStore = new SyncStore(collection);
          const query = new Query().equalTo('_id', entity._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity]);
        });
    });

    it('should clear only the entities from the sync table matching the query', function() {
      const store = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      return store.save(entity1)
        .then(() => {
          return store.save(entity2);
        })
        .then(() => {
          const query = new Query().equalTo('_id', entity1._id);
          return store.clearSync(query);
        })
        .then(() => {
          const query = new Query().equalTo('_id', entity1._id);
          return store.pendingSyncCount(query);
        })
        .then((count) => {
          expect(count).toEqual(0);
          const syncStore = new SyncStore(collection);
          const query = new Query().equalTo('_id', entity1._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity1]);
        });
    });
  });
});
