import { CacheStore, SyncStore } from 'src/datastore';
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
      const entity = {
        _id: randomString()
      };
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
      const entity1 = {
        _id: randomString()
      };
      const entity2 = {
        _id: randomString()
      };
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
        });
    });

    it('should return the entities that match the query', function(done) {
      const entity1 = {
        _id: randomString()
      };
      const entity2 = {
        _id: randomString()
      };
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
      const entity1 = {
        _id: randomString()
      };
      const entity2 = {
        _id: randomString()
      };
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
      const entity = {
        _id: randomString()
      };
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
      const entity = {
        _id: randomString()
      };
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
      const entity1 = {
        _id: randomString()
      };
      const entity2 = {
        _id: randomString()
      };
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
      const entity1 = {
        _id: randomString()
      };
      const entity2 = {
        _id: randomString()
      };
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
      const entity = {
        _id: randomString()
      };
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
      const entity1 = {
        _id: randomString(),
        title: randomString()
      };
      const entity2 = {
        _id: randomString(),
        title: randomString()
      };
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
      const entity = {
        _id: randomString()
      };
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
      const entity1 = {
        _id: randomString()
      };
      const entity2 = {
        _id: randomString()
      };
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

    it('should create an entity', function() {
      const store = new CacheStore(collection);
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
      const entity = {
        _id: randomString(),
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };

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

    it('should throw an error if an entity does not have an _id', async function() {
      const store = new CacheStore(collection);
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

    it('should update an entity with an _id', async function() {
      const store = new CacheStore(collection);
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

  // describe('remove()', function() {
  //   it('should throw an error for an invalid query', function() {
  //     const store = new CacheStore(collection);
  //     return store.remove({})
  //       .catch((error) => {
  //         expect(error).toBeA(KinveyError);
  //         expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
  //       });
  //   });

  //   it('should throw a ServerError', function() {
  //     nock(this.client.apiHostname)
  //       .delete(`/appdata/${this.client.appKey}/${collection}`)
  //       .reply(500);

  //     const store = new CacheStore(collection);
  //     return store.remove()
  //       .catch((error) => {
  //         expect(error).toBeA(ServerError);
  //         expect(error.message).toEqual('An error occurred on the server.');
  //       });
  //   });

  //   it('should remove all entities from the cache', function() {
  //     const entity1 = {
  //       _id: randomString()
  //     };
  //     const entity2 = {
  //       _id: randomString()
  //     };
  //     const store = new CacheStore(collection);

  //     nock(store.client.apiHostname)
  //       .get(`/appdata/${store.client.appKey}/${collection}`)
  //       .reply(200, [entity1, entity2]);

  //     return store.pull()
  //       .then(() => {
  //         const reply = { count: 2 };

  //         // nock(this.client.apiHostname)
  //         //   .delete(`/appdata/${this.client.appKey}/${collection}`)
  //         //   .reply(200, reply);

  //         return store.remove()
  //           .then((result) => {
  //             expect(result).toEqual(reply);
  //           });
  //       });
  //   });
  // });

  // describe('removeById()', function() {
  //   it('should throw a NotFoundError if the id argument does not exist', function() {
  //     const store = new CacheStore(collection);
  //     const _id = randomString();

  //     nock(this.client.apiHostname)
  //       .delete(`/appdata/${this.client.appKey}/${collection}/${_id}`)
  //       .reply(404);

  //     return store.removeById(_id)
  //       .catch((error) => {
  //         expect(error).toBeA(NotFoundError);
  //       });
  //   });

  //   it('should remove the entity that matches the id argument', function() {
  //     const store = new CacheStore(collection);
  //     const _id = randomString();
  //     const reply = { count: 1 };

  //     nock(this.client.apiHostname)
  //       .delete(`/appdata/${this.client.appKey}/${collection}/${_id}`)
  //       .reply(200, reply);

  //     return store.removeById(_id)
  //       .then((response) => {
  //         expect(response).toEqual(reply);
  //       });
  //   });
  // });

  describe('clear()', function() {
    const entity1 = {
      _id: randomString()
    };
    const entity2 = {
      _id: randomString()
    };

    beforeEach(function() {
      nock(this.client.apiHostname)
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      const store = new CacheStore(collection);
      return store.pull()
        .then((entities) => {
          expect(entities).toEqual([entity1, entity2]);
        });
    });

    afterEach(async function() {
      const store = new CacheStore(collection);
      return store.clear()
        .then(() => {
          return store.find(null, { syncAutomatically: false }).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove all entities from the cache', function() {
      const store = new CacheStore(collection);
      return store.clear()
        .then((entities) => {
          expect(entities).toEqual({ count: 2 });
          const syncStore = new SyncStore(collection);
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
          return store.pendingSyncEntities();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove only the entities from the cache that match the query', async function() {
      const store = new CacheStore(collection);
      const query = new Query().equalTo('_id', entity1._id);
      return store.clear(query)
        .then((entities) => {
          expect(entities).toEqual({ count: 1 });
          const syncStore = new SyncStore(collection);
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity2]);
          return store.pendingSyncEntities();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });
  });
});
