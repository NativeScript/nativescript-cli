import { CacheStore, SyncStore, SyncOperation } from 'src/datastore';
import Query from 'src/query';
import Aggregation from 'src/aggregation';
import { KinveyError, NotFoundError, ServerError } from 'src/errors';
import { randomString } from 'src/utils';
import nock from 'nock';
import expect from 'expect';
const collection = 'Books';

describe('CacheStore', function() {
  afterEach(function() {
    const store = new CacheStore(collection);
    return store.clear();
  });

  describe('pathname', function() {
    it(`should equal /appdata/<appkey>/${collection}`, function() {
      const store = new CacheStore(collection);
      expect(store.pathname).toEqual(`/appdata/${this.client.appKey}/${collection}`);
    });

    it('should not be able to be changed', function() {
      expect(() => {
        const store = new CacheStore(collection);
        store.pathname = `/tests/${collection}`;
      }).toThrow();
    });
  });

  describe('syncAutomatically', function() {
    it('should be true', function() {
      const store = new CacheStore(collection);
      expect(store.syncAutomatically).toEqual(true);
    });

    it('should not be able to be changed', function() {
      expect(() => {
        const store = new CacheStore(collection);
        store.syncAutomatically = false;
      }).toThrow();
    });
  });

  describe('find()', function() {
    it('should throw an error if the query argument is not an instance of the Query class', function(done) {
      const store = new CacheStore(collection);
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

    it('should throw an error if there are entities to sync', function(done) {
      const entity = { _id: randomString() };
      const syncStore = new SyncStore(collection);
      syncStore.save(entity)
        .then(() => {
          const store = new CacheStore(collection);
          store.find()
            .subscribe(null, (error) => {
              try {
                expect(error).toBeA(KinveyError);
                expect(error.message).toEqual(
                  'Unable to fetch the entities on the backend.'
                  + ' There are 1 entities that need to be synced.'
                );
                done();
              } catch (e) {
                done(e);
              }
            }, () => {
              done(new Error('This test should fail.'));
            });
        });
    });

    it('should return the entities', function(done) {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const entity3 = {
            _id: randomString()
          };

          nock(store.client.apiHostname)
            .get(store.pathname)
            .reply(200, [entity1, entity2, entity3]);

          store.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity1, entity2, entity3]]);

                onNextSpy.reset();
                const syncStore = new SyncStore(collection);
                syncStore.find()
                  .subscribe(onNextSpy, done, () => {
                    try {
                      expect(onNextSpy.calls.length).toEqual(1);
                      expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2, entity3]]);
                      done();
                    } catch (error) {
                      done(error);
                    }
                  });
              } catch (error) {
                done(error);
              }
            });
        })
        .catch(done);
    });

    it('should return the entities that match the query', function(done) {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection);
      const query = new Query().equalTo('_id', entity1._id);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(store.client.apiHostname)
            .get(`/appdata/${store.client.appKey}/${collection}`)
            .query({ query: JSON.stringify({ _id: entity1._id }) })
            .reply(200, [entity1]);

          store.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity1]]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });

    it('should remove entities that no longer exist on the backend from the cache', function(done) {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const entity3 = {
            _id: randomString()
          };

          nock(store.client.apiHostname)
            .get(`/appdata/${store.client.appKey}/${collection}`)
            .reply(200, [entity1, entity3]);

          store.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity1, entity3]]);

                onNextSpy.reset();
                const syncStore = new SyncStore(collection);
                syncStore.find()
                  .subscribe(onNextSpy, done, () => {
                    try {
                      expect(onNextSpy.calls.length).toEqual(1);
                      expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity3]]);
                      done();
                    } catch (error) {
                      done(error);
                    }
                  });
              } catch (error) {
                done(error);
              }
            });
        });
    });
  });

  describe('findById()', function() {
    it('should return undefined if an id is not provided', function(done) {
      const store = new CacheStore(collection);
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

    it('should throw an error if there are entities to sync', function(done) {
      const entity = { _id: randomString() };
      const syncStore = new SyncStore(collection);
      syncStore.save(entity)
        .then(() => {
          const store = new CacheStore(collection);
          store.findById(entity._id)
            .subscribe(null, (error) => {
              try {
                expect(error).toBeA(KinveyError);
                expect(error.message).toEqual(
                  'Unable to find the entity on the backend.'
                  + ' There are 1 entities that need to be synced.'
                );
                done();
              } catch (e) {
                done(e);
              }
            }, () => {
              done(new Error('This test should fail.'));
            });
        });
    });

    it('should throw a NotFoundError if the entity does not exist', function(done) {
      const entity = { _id: randomString() };
      const store = new CacheStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}/${entity._id}`)
        .reply(404);

      store.findById(entity._id)
        .subscribe(onNextSpy, (error) => {
          try {
            expect(onNextSpy.calls.length).toEqual(1);
            expect(onNextSpy.calls[0].arguments).toEqual([undefined]);
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
      const store = new CacheStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(store.client.apiHostname)
            .get(`/appdata/${store.client.appKey}/${collection}/${entity1._id}`)
            .reply(200, entity1);

          store.findById(entity1._id)
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([entity1]);
                expect(onNextSpy.calls[1].arguments).toEqual([entity1]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });

    it('should remove entities that no longer exist on the backend from the cache', function(done) {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(store.client.apiHostname)
            .get(`/appdata/${store.client.appKey}/${collection}/${entity1._id}`)
            .reply(404);

          store.findById(entity1._id)
            .subscribe(onNextSpy, (error) => {
              try {
                expect(onNextSpy.calls.length).toEqual(1);
                expect(onNextSpy.calls[0].arguments).toEqual([entity1]);
                expect(error).toBeA(NotFoundError);
                done();
              } catch (e) {
                done(e);
              }
            }, () => {
              done(new Error('This test should fail.'));
            });
        });
    });
  });

  describe('group()', function() {
    it('should throw an error if the query argument is not an instance of the Query class', function(done) {
      const store = new CacheStore(collection);
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

    it('should throw a ServerError', function(done) {
      const store = new CacheStore(collection);
      const aggregation = new Aggregation();

      nock(this.client.apiHostname)
        .post(`/appdata/${this.client.appKey}/${collection}/_group`)
        .reply(500);

      store.group(aggregation)
        .subscribe(null, (error) => {
          try {
            expect(error).toBeA(ServerError);
            done();
          } catch (e) {
            done(e);
          }
        }, () => {
          done(new Error('This test should fail.'));
        });
    });

    it('should throw an error if there are entities to sync', function(done) {
      const entity = { _id: randomString() };
      const syncStore = new SyncStore(collection);
      syncStore.save(entity)
        .then(() => {
          const aggregation = new Aggregation();
          const store = new CacheStore(collection);
          store.group(aggregation)
            .subscribe(null, (error) => {
              try {
                expect(error).toBeA(KinveyError);
                expect(error.message).toEqual(
                  'Unable to group entities on the backend.'
                  + ' There are 1 entities that need to be synced.'
                );
                done();
              } catch (e) {
                done(e);
              }
            }, () => {
              done(new Error('This test should fail.'));
            });
        });
    });

    it('should return the count of all unique properties on the collection', function(done) {
      const entity1 = { _id: randomString(), title: randomString() };
      const entity2 = { _id: randomString(), title: randomString() };
      const store = new CacheStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const aggregation = Aggregation.count('title');
          const reply = [{ title: randomString(), count: 2 }, { title: randomString(), count: 1 }];
          nock(this.client.apiHostname)
            .post(`/appdata/${this.client.appKey}/${collection}/_group`)
            .reply(200, reply);

          store.group(aggregation)
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[{ count: 1, title: entity1.title }, { count: 1, title: entity2.title }]]);
                expect(onNextSpy.calls[1].arguments).toEqual([reply]);
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
      const store = new CacheStore(collection);
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

    it('should throw a ServerError', function(done) {
      const store = new CacheStore(collection);

      nock(this.client.apiHostname)
        .get(`/appdata/${this.client.appKey}/${collection}/_count`)
        .reply(500);

      store.count()
        .subscribe(null, (error) => {
          try {
            expect(error).toBeA(ServerError);
            done();
          } catch (e) {
            done(e);
          }
        }, () => {
          done(new Error('This test should fail.'));
        });
    });

    it('should throw an error if there are entities to sync', function(done) {
      const entity = { _id: randomString() };
      const syncStore = new SyncStore(collection);
      syncStore.save(entity)
        .then(() => {
          const store = new CacheStore(collection);
          store.count()
            .subscribe(null, (error) => {
              try {
                expect(error).toBeA(KinveyError);
                expect(error.message).toEqual(
                  'Unable to count entities on the backend.'
                  + ' There are 1 entities that need to be synced.'
                );
                done();
              } catch (e) {
                done(e);
              }
            }, () => {
              done(new Error('This test should fail.'));
            });
        });
    });

    it('should return the count for the collection', function(done) {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection);
      const onNextSpy = expect.createSpy();

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(this.client.apiHostname)
            .get(`/appdata/${this.client.appKey}/${collection}/_count`)
            .reply(200, { count: 3 });

          store.count()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([2]);
                expect(onNextSpy.calls[1].arguments).toEqual([3]);
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
      const store = new CacheStore(collection);
      const entity1 = {};
      const entity2 = {};

      return store.create([entity1, entity2])
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Unable to create an array of entities.');
        });
    });

    it('should create an entity', function() {
      const store = new CacheStore(collection);
      const entity = { title: randomString() };
      const reply = { _id: randomString(), title: entity.title };

      nock(this.client.apiHostname)
        .post(`/appdata/${this.client.appKey}/${collection}`, entity)
        .reply(201, reply);

      return store.create(entity)
        .then((createdEntity) => {
          expect(createdEntity).toEqual(reply);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new SyncStore(collection);
          const query = new Query();
          query.equalTo('_id', createdEntity._id);
          return syncStore.find(query).toPromise()
            .then((entities) => {
              expect(entities).toEqual([createdEntity]);
              return store.pendingSyncCount();
            })
            .then((count) => {
              expect(count).toEqual(0);
            });
        });
    });

    it('should create an entity if it contains an _id', async function() {
      const store = new CacheStore(collection);
      const entity = { _id: randomString() };

      nock(this.client.apiHostname)
        .post(`/appdata/${this.client.appKey}/${collection}`, entity)
        .reply(200, entity);

      return store.create(entity)
        .then((createdEntity) => {
          expect(createdEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new SyncStore(collection);
          const query = new Query();
          query.equalTo('_id', createdEntity._id);
          return syncStore.find(query).toPromise()
            .then((entities) => {
              expect(entities).toEqual([createdEntity]);
              return store.pendingSyncCount();
            })
            .then((count) => {
              expect(count).toEqual(0);
            });
        });
    });
  });

  describe('update()', function() {
    it('should throw an error if trying to update an array of entities', async function() {
      const store = new CacheStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      return store.update([entity1, entity2])
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Unable to update an array of entities.');
        });
    });

    it('should throw an error if an entity does not have an _id', async function() {
      const store = new CacheStore(collection);
      const entity = {};

      return store.update(entity)
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('The entity provided does not contain an _id. An _id is required to update the entity.');
          expect(error.debug).toEqual(entity);
        });
    });

    it('should update an entity with an _id', async function() {
      const store = new CacheStore(collection);
      const entity = { _id: randomString() };

      nock(this.client.apiHostname)
        .put(`/appdata/${this.client.appKey}/${collection}/${entity._id}`, entity)
        .reply(200, entity);

      return store.update(entity)
        .then((updatedEntity) => {
          expect(updatedEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new SyncStore(collection);
          const query = new Query();
          query.equalTo('_id', updatedEntity._id);
          return syncStore.find(query).toPromise()
            .then((entities) => {
              expect(entities).toEqual([updatedEntity]);
              return store.pendingSyncCount();
            })
            .then((count) => {
              expect(count).toEqual(0);
            });
        });
    });
  });

  describe('save()', function() {
    afterEach(function () {
      expect.restoreSpies();
    });

    it('should call create() for an entity that does not contain an _id', function() {
      const store = new CacheStore(collection);
      const spy = expect.spyOn(store, 'create');
      store.save({});
      expect(spy).toHaveBeenCalled();
    });

    it('should call update() for an entity that contains an _id', function() {
      const store = new CacheStore(collection);
      const spy = expect.spyOn(store, 'update');
      store.save({ _id: randomString() });
      expect(spy).toHaveBeenCalled();
    });

    it('should call create() when an array of entities is provided', function() {
      const store = new CacheStore(collection);
      const spy = expect.spyOn(store, 'create');
      store.save([{ _id: randomString() }, {}]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('remove()', function() {
    it('should throw an error if the query argument is not an instance of the Query class', function() {
      const store = new CacheStore(collection);
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
      const store = new CacheStore(collection);
      return store.remove()
        .then((result) => {
          expect(result).toEqual({ count: 0 });
        });
    });

    it('should remove all the entities', function() {
      const store = new CacheStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => {
          nock(store.client.apiHostname)
            .delete(`/appdata/${store.client.appKey}/${collection}/${entity1._id}`)
            .reply(200);

          nock(store.client.apiHostname)
            .delete(`/appdata/${store.client.appKey}/${collection}/${entity2._id}`)
            .reply(200);

          return store.remove();
        })
        .then((result) => {
          expect(result).toEqual({ count: 2 });
          const syncStore = new SyncStore(collection);
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(0);
        });
    });

    it('should remove all the entities that match the query', function() {
      const store = new CacheStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => {
          const query = new Query().equalTo('_id', entity1._id);

          nock(store.client.apiHostname)
            .delete(`/appdata/${store.client.appKey}/${collection}/${entity1._id}`)
            .reply(200);

          return store.remove(query);
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const syncStore = new SyncStore(collection);
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity2]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(0);
        });
    });

    it('should not remove the entity from the cache if the backend request failed', function() {
      const store = new CacheStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => {
          const query = new Query().equalTo('_id', entity1._id);

          nock(store.client.apiHostname)
            .delete(`/appdata/${store.client.appKey}/${collection}/${entity1._id}`)
            .reply(500);

          return store.remove(query);
        })
        .then((result) => {
          expect(result).toEqual({ count: 0 });
          const syncStore = new SyncStore(collection);
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity1, entity2]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });

    it('should remove an entity if it was created locally', function() {
      const store = new CacheStore(collection);
      const syncStore = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const entity3 = {};

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => syncStore.save(entity3))
        .then(() => {
          nock(store.client.apiHostname)
            .delete(`${store.pathname}/${entity1._id}`)
            .reply(200);

          nock(store.client.apiHostname)
            .delete(`${store.pathname}/${entity2._id}`)
            .reply(200);

          return store.remove();
        })
        .then((result) => {
          expect(result).toEqual({ count: 3 });
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(0);
        });
    });
  });

  describe('removeById()', function() {
    it('should return a { count: 0 } if an id is not provided', function() {
      const store = new CacheStore(collection);
      return store.removeById()
        .then((result) => {
          expect(result).toEqual({ count: 0 });
        });
    });

    it('should remove the entity from cache if the entity is not found on the backend', function() {
      const store = new CacheStore(collection);
      const entity = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity]);

      return store.pull()
        .then(() => {
          nock(store.client.apiHostname)
            .delete(`/appdata/${store.client.appKey}/${collection}/${entity._id}`)
            .reply(404);

          return store.removeById(entity._id);
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const syncStore = new SyncStore(collection);
          const query = new Query().equalTo('_id', entity._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove the entity from the backend', function() {
      const store = new CacheStore(collection);
      const entity = { _id: randomString() };

      nock(store.client.apiHostname)
        .get(`/appdata/${store.client.appKey}/${collection}`)
        .reply(200, [entity]);

      return store.pull()
        .then(() => {
          nock(store.client.apiHostname)
            .delete(`/appdata/${store.client.appKey}/${collection}/${entity._id}`)
            .reply(200, { count: 1 });

          return store.removeById(entity._id);
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const syncStore = new SyncStore(collection);
          const query = new Query().equalTo('_id', entity._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove the entity from the cache and sync table', function() {
      const store = new CacheStore(collection);
      const syncStore = new SyncStore(collection);
      const entity = {};

      return syncStore.save(entity)
        .then(entity => store.removeById(entity._id))
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const query = new Query().equalTo('_id', entity._id);
          return syncStore.find(query).toPromise();
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
      const store = new CacheStore(collection);
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
          const syncStore = new SyncStore(collection);
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove only the entities from the cache that match the query', function() {
      const store = new CacheStore(collection);
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
          const syncStore = new SyncStore(collection);
          const query = new Query().equalTo('_id', entity1._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });
  });

  describe('pendingSyncCount()', function() {
    it('should return the count of entities waiting to be synced', function() {
      const store = new CacheStore(collection);
      const syncStore = new SyncStore(collection);
      const entity = {};

      return syncStore.save(entity)
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
      const store = new CacheStore(collection);
      const syncStore = new SyncStore(collection);
      const entity = {};

      return syncStore.save(entity)
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

  describe('push()', function() {
    it('should push the entities to the backend', function() {
      const store = new CacheStore(collection);
      const syncStore = new SyncStore(collection);
      const entity = { _id: randomString() };

      return syncStore.save(entity)
        .then(() => {
          nock(store.client.apiHostname)
            .put(`${store.pathname}/${entity._id}`, entity)
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
      const store = new CacheStore(collection);
      const syncStore = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      return syncStore.save(entity1)
        .then(() => syncStore.save(entity2))
        .then(() => {
          nock(store.client.apiHostname)
            .put(`${store.pathname}/${entity1._id}`, entity1)
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

  describe('pull()', function() {
    it('should save entities from the backend to the cache', function() {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection);

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

  describe('sync()', function() {
    it('should push any pending sync entities and then pull entities from the backend and save them to the cache', function() {
      const store = new CacheStore(collection);
      const syncStore = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      return syncStore.save(entity1)
        .then(() => {
          nock(store.client.apiHostname)
            .put(`${store.pathname}/${entity1._id}`, entity1)
            .reply(200, entity1);

          nock(store.client.apiHostname)
            .get(store.pathname)
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
      const store = new CacheStore(collection);
      const syncStore = new SyncStore(collection);
      const entity = { _id: randomString() };

      return syncStore.save(entity)
        .then(() => {
          return store.clearSync();
        })
        .then(() => {
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(0);
          const query = new Query().equalTo('_id', entity._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity]);
        });
    });

    it('should clear only the entities from the sync table matching the query', function() {
      const store = new CacheStore(collection);
      const syncStore = new SyncStore(collection);
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      return syncStore.save(entity1)
        .then(() => syncStore.save(entity2))
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
          const query = new Query().equalTo('_id', entity1._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity1]);
        });
    });
  });
});
