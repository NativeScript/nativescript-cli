import nock from 'nock';
import expect from 'expect';
import { CacheStore } from './cachestore';
import { SyncEvent } from './sync';
import { init } from 'kinvey-app';
import { Query } from 'kinvey-query';
import * as Aggregation from 'kinvey-aggregation';
import { KinveyError, NotFoundError, ServerError, BadRequestError } from '../../errors';
import { randomString } from 'kinvey-test-utils';
import { register as registerHttp } from 'kinvey-http-node';
import { login } from 'kinvey-identity';
import { register as registerCache} from 'kinvey-cache-memory';

const collection = 'Books';
const pendingPushEntitiesErrMsg = 'There is 1 entity, matching the provided query or id, pending push to the backend.';

describe('CacheStore', () => {
  let client;

  before(() => {
    registerHttp();
    registerCache();
  });

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString(),
      apiHostname: "https://baas.kinvey.com",
      micHostname: "https://auth.kinvey.com"
    });
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

    return login(username, password);
  });

  afterEach(() => {
    const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
    return store.clear();
  });

  afterEach(() => {
    const store = new CacheStore(client.appKey, collection, null, {autoSync: false});
    return store.clear();
  });


  describe('pathname', () => {//TODO: since cachestore does not inherit networkStore pathname getter is not available
    it(`should equal /appdata/<appkey>/${collection}`, () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      expect(store.pathname).toEqual(`/appdata/${client.appKey}/${collection}`);
    });

    it('should not be able to be changed', () => {
      expect(() => {
        const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
        store.pathname = `/tests/${collection}`;
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe.only('find()', () => {//TODO: Unhandle exception query.toQueryObject is not a function
    it('should throw an error if the query argument is not an instance of the Query class', (done) => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
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

    it('should throw an error if there are entities to sync', (done) => {
      const entity = { _id: randomString() };
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
      syncStore.save(entity)
        .then(() => {
          const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
          store.find()
            .subscribe(null, (error) => {
              try {
                expect(error).toBeA(KinveyError);
                expect(error.message).toInclude(pendingPushEntitiesErrMsg);
                done();
              } catch (e) {
                done(e);
              }
            }, () => {
              done(new Error('This test should fail.'));
            });
        });
    });

    it('should throw an error if trying to access a property on undefined', (done) => {//TODO: needs error to be reverted
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const onNextSpy = expect.createSpy();

      store.find()
        .subscribe((entities) => {
          return entities[0].name;
        }, (error) => {
          try {
            expect(error).toBeA(TypeError);
            done();
          } catch (e) {
            done(e);
          }
        }, () => {
          done(new Error('This test should fail.'));
        });
    });

    it('should return the entities', (done) => {//TODO: seems that both calls to find return the items from the network call
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      store.pathname = `/appdata/${client.appKey}/${collection}`
      const onNextSpy = expect.createSpy();
      nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const entity3 = {
            _id: randomString()
          };
          
          nock(client.apiHostname)
            .get(store.pathname)
            .reply(200, [entity1, entity2, entity3]);

          store.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity1, entity2, entity3]]);

                onNextSpy.reset();
                const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

    it('should return the entities that match the query', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const query = new Query().equalTo('_id', entity1._id);
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}`)
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

    it('should return the entities that match the query but don\'t contain all matching properties', (done) => {//TODO: this test makes no sense, but it is ok in the old sdk
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const query = new Query().equalTo('name', randomString());
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}`)
            .query(query.toQueryString())
            .reply(200, [entity1]);

          store.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity1]]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });

    describe('Delta Set', () => {
      it('should find the entities', (done) => {
        const entity1 = { _id: randomString() };
        const entity2 = { _id: randomString() };
        const store = new CacheStore(client.appKey, collection, null, { useDeltaSet: true, autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();

        nock(client.apiHostname)
          .get(`/appdata/${client.appKey}/${collection}`)
          .reply(200, [entity1, entity2], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull()
          .then(() => {
            const changedEntity2 = Object.assign({}, entity2, { title: 'test' });
            nock(client.apiHostname)
              .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
              .query({ since: lastRequestDate.toISOString() })
              .reply(200, { changed: [changedEntity2], deleted: [{ _id: entity1._id }] }, {
                'X-Kinvey-Request-Start': new Date().toISOString()
              });

            store.find()
              .subscribe(onNextSpy, done, () => {
                try {
                  expect(onNextSpy.calls.length).toEqual(2);
                  expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                  expect(onNextSpy.calls[1].arguments).toEqual([[changedEntity2]]);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          })
          .catch(done);
      });

      it('should find the entities that match the query', (done) => {
        const entity1 = { _id: randomString(), title: 'Test' };
        const entity2 = { _id: randomString(), title: 'Test' };
        const store = new CacheStore(client.appKey, collection, null, { useDeltaSet: true, autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();
        const query = new Query().equalTo('title', 'Test');

        nock(client.apiHostname)
          .get(`/appdata/${client.appKey}/${collection}`)
          .query(query.toQueryString())
          .reply(200, [entity1, entity2], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull(query)
          .then(() => {
            const changedEntity2 = Object.assign({}, entity2, { author: 'Kinvey' });
            nock(client.apiHostname)
              .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
              .query(Object.assign({ since: lastRequestDate.toISOString() }, query.toQueryString()))
              .reply(200, { changed: [changedEntity2], deleted: [{ _id: entity1._id }] }, {
                'X-Kinvey-Request-Start': new Date().toISOString()
              });

            store.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  expect(onNextSpy.calls.length).toEqual(2);
                  expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                  expect(onNextSpy.calls[1].arguments).toEqual([[changedEntity2]]);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          })
          .catch(done);
      });

      it('should not send a delta set request if skip is used', (done) => {
        const entity1 = { _id: randomString() };
        const store = new CacheStore(client.appKey, collection, null, { useDeltaSet: true, autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();
        const query = new Query();
        query.skip = 1;

        nock(client.apiHostname)
          .get(`/appdata/${client.appKey}/${collection}`)
          .query(query.toQueryString())
          .reply(200, [entity1], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull(query)
          .then(() => {
            nock(client.apiHostname)
              .get(`/appdata/${client.appKey}/${collection}`)
              .query(query.toQueryString())
              .reply(200, [entity1], {
                'X-Kinvey-Request-Start': new Date().toISOString()
              });

            store.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  expect(onNextSpy.calls.length).toEqual(2);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          })
          .catch(done);
      });

      it('should not send a delta set request if limit is used', (done) => {
        const entity1 = { _id: randomString() };
        const store = new CacheStore(client.appKey, collection, null, { useDeltaSet: true, autoSync: true});
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();
        const query = new Query();
        query.limit = 1;

        nock(client.apiHostname)
          .get(`/appdata/${client.appKey}/${collection}`)
          .query(query.toQueryString())
          .reply(200, [entity1], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull(query)
          .then(() => {
            nock(client.apiHostname)
              .get(`/appdata/${client.appKey}/${collection}`)
              .query(query.toQueryString())
              .reply(200, [entity1], {
                'X-Kinvey-Request-Start': new Date().toISOString()
              });

            store.find(query)
              .subscribe(onNextSpy, done, () => {
                try {
                  expect(onNextSpy.calls.length).toEqual(2);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          })
          .catch(done);
      });

      it('should work with a tagged datastore', (done) => {
        const entity1 = { _id: randomString() };
        const entity2 = { _id: randomString() };
        const store = new CacheStore(client.appKey, collection, null, { useDeltaSet: true, tag: randomString(), autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();

        nock(client.apiHostname)
          .get(`/appdata/${client.appKey}/${collection}`)
          .reply(200, [entity1, entity2], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull()
          .then(() => {
            const changedEntity2 = Object.assign({}, entity2, { title: 'test' });
            nock(client.apiHostname)
              .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
              .query({ since: lastRequestDate.toISOString() })
              .reply(200, { changed: [changedEntity2], deleted: [{ _id: entity1._id }] }, {
                'X-Kinvey-Request-Start': new Date().toISOString()
              });

            store.find()
              .subscribe(onNextSpy, done, () => {
                try {
                  expect(onNextSpy.calls.length).toEqual(2);
                  expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                  expect(onNextSpy.calls[1].arguments).toEqual([[changedEntity2]]);
                  done();
                } catch (error) {
                  done(error);
                }
              });
          })
          .catch(done);
      });

      it('should send regular GET request with outdated lastRequest', function (done){
        const entity1 = { _id: randomString() };
        const entity2 = { _id: randomString() };
        const store = new CacheStore(client.appKey, collection, null, { useDeltaSet: true, autoSync: true});
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();
        lastRequestDate.setDate(new Date().getDate()-31);

        nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2], {
          'X-Kinvey-Request-Start': lastRequestDate.toISOString()
        });

          store.pull()
            .then(()=>{
              nock(client.apiHostname)
                .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
                .query({ since: lastRequestDate.toISOString() })
                .reply(400, {debug: "The 'since' timestamp must be within the past 1 days.",
                  description: "The value specified for one of the request parameters is out of range",
                  error: "ParameterValueOutOfRange"});

              nock(client.apiHostname)
              .get(`/appdata/${client.appKey}/${collection}`)
              .reply(200, [entity1, entity2], {
                'X-Kinvey-Request-Start': lastRequestDate.toISOString()
              });
              store.find()
                .subscribe(onNextSpy, done, ()=>{
                  try{
                    expect(onNextSpy.calls.length).toEqual(2);
                    expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                    expect(onNextSpy.calls[1].arguments).toEqual([[entity1, entity2]]);
                    done();
                  } catch (error) {
                    done(error);
                  }
                })
            })
            .catch(done);
      });

      it('should send regular GET request when configuration is missing on the backend', function (done){
        const entity1 = { _id: randomString() };
        const entity2 = { _id: randomString() };
        const store = new CacheStore(client.appKey, collection, null, { useDeltaSet: true, autoSync: true});
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();
        const firstNock = nock(client.apiHostname)
          .get(`/appdata/${client.appKey}/${collection}`)
          .reply(200, [entity1, entity2], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

          store.pull()
            .then(()=>{
              firstNock.done();
              const secondNock = nock(client.apiHostname)
                .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
                .query({ since: lastRequestDate.toISOString() })
                .reply(403, {
                  "error": "MissingConfiguration",
                  "description": "This feature is not properly configured for this app backend. Please configure it through the console first, or contact support for more information.",
                  "debug": "This collection has not been configured for Delta Set access."
                });

              const thirdNock = nock(client.apiHostname)
                .get(`/appdata/${client.appKey}/${collection}`)
                .reply(200, [entity1, entity2], {
                  'X-Kinvey-Request-Start': lastRequestDate.toISOString()
                });
              store.find()
                .subscribe(onNextSpy, done, ()=>{
                  try{
                    secondNock.done();
                    thirdNock.done();
                    expect(onNextSpy.calls.length).toEqual(2);
                    expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                    expect(onNextSpy.calls[1].arguments).toEqual([[entity1, entity2]]);
                    done();
                  } catch (error) {
                    done(error);
                  }
                })
            })
            .catch(done);
      });

      it('should return error if more than 10000 items are changed', function (done){//TODO:  errors not reverted
        const entity1 = { _id: randomString() };
        const entity2 = { _id: randomString() };
        const store = new CacheStore(client.appKey, collection, null, { useDeltaSet: true, autoSync: true});
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();

        nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2], {
          'X-Kinvey-Request-Start': lastRequestDate.toISOString()
        });

          store.pull()
            .then(()=>{
              nock(client.apiHostname)
                .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
                .query({ since: lastRequestDate.toISOString() })
                .reply(400, {
                  error: "BadRequest",
                  description: "Unable to understand request",
                  debug: "ResultSetSizeExceeded"
              });
              store.find()
                .subscribe(null, (error)=>{
                  try{
                    expect(error).toBeA(BadRequestError);
                    expect(error.debug).toEqual('ResultSetSizeExceeded')
                    done();
                  } catch (e) {
                    done(e);
                  }
                })
            })
            .catch(done);
      });
    });

    it('should remove entities that no longer exist on the backend from the cache', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const entity3 = {
            _id: randomString()
          };

          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}`)
            .reply(200, [entity1, entity3]);

          store.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity1, entity3]]);

                onNextSpy.reset();
                const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

    it('should add kinveyfile_ttl query parameter', () => {//TODO: It seems we do not send the kinvey_ttl query param
      const store = new CacheStore(client.appKey, 'comecollection', null, {autoSync: true});
      const entity1 = { _id: randomString() };
      store.pathname = `/appdata/${client.appKey}/comecollection`;
      nock(client.apiHostname)
        .get(store.pathname)
        .query({ kinveyfile_ttl: 3600 })
        .reply(200, [entity1]);

      return store.find(null, { kinveyFileTTL: 3600 }).toPromise()
        .then((entities) => {
          expect(entities).toEqual([entity1]);
        });
    });

    it('should add kinveyfile_tls query parameter', () => {//TODO: It seems we do not send the kinvey_tls query param
      const store = new CacheStore('comecollection');
      const entity1 = { _id: randomString() };
      store.pathname = `/appdata/${client.appKey}/comecollection`;
      nock(client.apiHostname)
        .get(store.pathname)
        .query({ kinveyfile_tls: true })
        .reply(200, [entity1]);

      return store.find(null, { kinveyFileTLS: true }).toPromise()
        .then((entities) => {
          expect(entities).toEqual([entity1]);
        });
    });
  });

  describe('findById()', () => {
    it('should return undefined if an id is not provided', (done) => {//TODO: Should be adjusted when errors are reverted - the current behavior is wrong
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
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

    it('should throw an error if there are entities to sync', (done) => { //TODO: Errors should be reverted
      const entity = { _id: randomString() };
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
      syncStore.save(entity)
        .then(() => {
          const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
          store.findById(entity._id)
            .subscribe(null, (error) => {
              try {
                expect(error).toBeA(KinveyError);
                expect(error.message).toInclude(pendingPushEntitiesErrMsg);
                done();
              } catch (e) {
                done(e);
              }
            }, () => {
              done(new Error('This test should fail.'));
            });
        });
    });

    it('should throw a NotFoundError if the entity does not exist', (done) => {//TODO: Errors should be reverted
      const entity = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}/${entity._id}`)
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

    it('should return the entity that matches the id', (done) => {//TODO: No request to collection/id is sent but a query - _id:id
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}/${entity1._id}`)
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

    it('should remove entities that no longer exist on the backend from the cache', (done) => {//TODO: Errors should be reverted
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}/${entity1._id}`)
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

  describe('group()', () => {
    it('should throw an error if the query argument is not an instance of the Query class', (done) => {//TODO: Errors should be reverted
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
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

    it('should throw a ServerError', (done) => {//TODO: Errors should be reverted
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const aggregation = new Aggregation();

      nock(client.apiHostname)
        .post(`/appdata/${client.appKey}/${collection}/_group`)
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

    it('should return the count of all unique properties on the collection', (done) => {//TODO: cache group is not a function
      const entity1 = { _id: randomString(), title: randomString() };
      const entity2 = { _id: randomString(), title: randomString() };
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const aggregation = Aggregation.count('title');
          const reply = [{ title: randomString(), count: 2 }, { title: randomString(), count: 1 }];
          nock(client.apiHostname)
            .post(`/appdata/${client.appKey}/${collection}/_group`)
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

  describe('count()', () => {//TODO:  count should have validation for empty object or null
    it('should throw an error if the query argument is not an instance of the Query class', (done) => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
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

    it('should throw a ServerError', (done) => {//TODO: errors should be reverted
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}/_count`)
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

    it('should return the count for the collection', (done) => {//TODO: we do not send _count requests
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}/_count`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}`)
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

  describe('create()', () => {
    it('should throw an error if trying to create an array of entities', () => {//TODO: errors should be reverted
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity1 = {};
      const entity2 = {};

      return store.create([entity1, entity2])
        .then(() => Promise.reject(new Error('This should not happen')))
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Unable to create an array of entities.');
        });
    });

    it('should create an entity', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity = { title: randomString() };
      const reply = { _id: randomString(), title: entity.title };

      nock(client.apiHostname)
        .post(`/appdata/${client.appKey}/${collection}`, (body) => {
          return body.title === entity.title;
        })
        .reply(201, reply);

      return store.create(entity)
        .then((createdEntity) => {
          expect(createdEntity).toEqual(reply);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

    it('should create an entity if it contains an _id', async () => {//TODO:  we add _kmd property to the created entity
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity = { _id: randomString() };

      nock(client.apiHostname)
        .post(`/appdata/${client.appKey}/${collection}`, entity)
        .reply(200, entity);

      return store.create(entity)
        .then((createdEntity) => {
          expect(createdEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

    it('should send custom properties in x-kinvey-custom-request-properties header', async () => {//TODO: x-kinvey-custom-request-properties is not set
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity = { _id: randomString(),_kmd:{} };
      const properties = { a: 'b' };

      nock(client.apiHostname, {
        reqheaders: {
          'x-kinvey-custom-request-properties': JSON.stringify(properties)
        }
      })      
        .post(`/appdata/${client.appKey}/${collection}`, entity)
        .reply(200, entity);

      return store.create(entity, { properties })
        .then((createdEntity) => {
          expect(createdEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

  describe('update()', () => {
    it('should throw an error if trying to update an array of entities', async () => {//TODO: errors need to be reverted
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      return store.update([entity1, entity2])
        .then(() => Promise.reject(new Error('This should not happen')))
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Unable to update an array of entities.');
        });
    });

    it('should throw an error if an entity does not have an _id', async () => {//TODO: errors need to be reverted
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity = {};

      return store.update(entity)
        .then(() => Promise.reject(new Error('This should not happen')))
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('The entity provided does not contain an _id. An _id is required to update the entity.');
          expect(error.debug).toEqual(entity);
        });
    });

    it('should update an entity with an _id', async () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity = { _id: randomString() };

      nock(client.apiHostname)
        .put(`/appdata/${client.appKey}/${collection}/${entity._id}`, entity)
        .reply(200, entity);

      return store.update(entity)
        .then((updatedEntity) => {
          expect(updatedEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

    it('should send custom properties in x-kinvey-custom-request-properties header', async () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity = { _id: randomString(), _kmd:{} };
      const properties = { a: 'b' };

      nock(client.apiHostname, {
        reqheaders: {
          'x-kinvey-custom-request-properties': JSON.stringify(properties)
        }
      })
        .put(`/appdata/${client.appKey}/${collection}/${entity._id}`, entity)
        .reply(200, entity);

      return store.update(entity, { properties })
        .then((updatedEntity) => {
          expect(updatedEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

  describe('save()', () => {
    afterEach(function () {
      expect.restoreSpies();
    });

    it('should call create() for an entity that does not contain an _id', () => {//TODO: Why are the ones below not failing
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const spy = expect.spyOn(store, 'create');
      const entity = {};
      const options = {};
      store.save(entity, options);
      expect(spy).toHaveBeenCalledWith(entity, options);
    });

    it('should call update() for an entity that contains an _id', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const spy = expect.spyOn(store, 'update');
      const entity = { _id: randomString() };
      const options = {};
      store.save(entity, options);
      expect(spy).toHaveBeenCalledWith(entity, options);
    });

    it('should call create() when an array of entities is provided', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const spy = expect.spyOn(store, 'create');
      store.save([{ _id: randomString() }, {}]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {//TODO:  errors should be reverted //delete is sent to collection/id and count is simply 0
    it('should throw an error if the query argument is not an instance of the Query class', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      return store.remove({})
        .then(() => Promise.reject(new Error('This should not happen.')))
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
        });
    });

    it('should return a { count: 0 } when no entities are removed', () => { //TODO: returning 0 instead of {count:0}
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});

      nock(client.apiHostname)
        .delete(`/appdata/${client.appKey}/${collection}`)
        .reply(200);

      return store.remove()
        .then((result) => {
          expect(result).toEqual({ count: 0 });
        });
    });

    it('should remove all the entities', () => {//TODO: Delete with no query now sends requests to collectio/id
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      nock(client.apiHostname)
        .delete(`/appdata/${client.appKey}/${collection}`)
        .reply(200);

      return store.pull()
        .then(() => store.remove())
        .then((result) => {
          expect(result).toEqual({ count: 2 });
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

    it('should remove all the entities that match the query', () => {//TODO: The result from delete is just 1, and it should be {count:1}
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => {
          const query = new Query().equalTo('_id', entity1._id);

          nock(client.apiHostname)
            .delete(`/appdata/${client.appKey}/${collection}/${entity1._id}`)
            .query(true)
            .reply(200);

          return store.remove(query);
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

    it('should not remove the entity from the cache if the backend request failed', () => {//TODO: delete is sent to collection/id and count is simply 0
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      const pullScope = nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      const deleteScope = nock(client.apiHostname)
        .delete(`/appdata/${client.appKey}/${collection}/${entity1._id}`)
        .query(true)
        .reply(500);

      return store.pull()
        .then(() => {
          pullScope.done();
          const query = new Query().equalTo('_id', entity1._id);
          return store.remove(query);
        })
        .then((result) => {
          deleteScope.done();
          expect(result).toEqual({ count: 0 });
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

    it('should remove an entity if it was created locally', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const entity3 = {};
      store.pathname = `/appdata/${client.appKey}/${collection}`;
      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => syncStore.save(entity3))
        .then(() => {
          nock(client.apiHostname)
            .delete(`${store.pathname}`)
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

  describe('removeById()', () => {//TODO:  errors should be reverted //TODO: delete is sent to collection/id and count is simply 0
    it('should return a { count: 0 } if an id is not provided', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      return store.removeById()
        .then((result) => {
          expect(result).toEqual({ count: 0 });
        });
    });

    it('should return a NotFoundError if an entity with that id does not exist', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      return store.clear()
        .then(() => store.removeById(randomString()))
        .then(() => Promise.reject(new Error('Should not happen')))
        .catch((err) => {
          expect(err).toBeA(NotFoundError);
        });
    });

    it('should remove the entity from cache if the entity is not found on the backend', () => {//TODO: remove and removeById enter the pushResults.error clause and decrease the result
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity = { _id: randomString() };

      const pullScope = nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity]);

      const deleteScope = nock(client.apiHostname)
        .delete(`/appdata/${client.appKey}/${collection}/${entity._id}`)
        .reply(404);

      return store.pull()
        .then(() => {
          pullScope.done();
          return store.removeById(entity._id);
        })
        .then((result) => {
          deleteScope.done();
          expect(result).toEqual({ count: 1 });
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
          const query = new Query().equalTo('_id', entity._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove the entity from the backend', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity = { _id: randomString() };

      const pullScope = nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity]);

      const deleteScope = nock(client.apiHostname)
        .delete(`/appdata/${client.appKey}/${collection}/${entity._id}`)
        .reply(200, { count: 1 });

      return store.pull()
        .then(() => {
          pullScope.done();
          return store.removeById(entity._id);
        })
        .then((result) => {
          deleteScope.done();
          expect(result).toEqual({ count: 1 });
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
          const query = new Query().equalTo('_id', entity._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove the entity from the cache and sync table and not make a request for a local entity', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

  describe('clear()', () => {//TODO:  errors should be reverted and clear returns boolean
    it('should remove all entities only from the cache', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const entity = { _id: randomString() };

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity]);

      return store.pull()
        .then(() => {
          return store.clear();
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove only the entities from the cache that match the query', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => {
          entity1.someProp = 'updated';
          return syncStore.update(entity1);
        })
        .then(() => {
          entity2.someProp = 'also updated';
          return syncStore.update(entity2);
        })
        .then(() => store.pendingSyncEntities())
        .then((syncEntities) => {
          expect(syncEntities.length).toEqual(2);
        })
        .then(() => {
          const query = new Query().equalTo('_id', entity1._id);
          return store.clear(query);
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const query = new Query().equalTo('_id', entity1._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
          return store.pendingSyncEntities();
        })
        .then((syncEntities) => {
          expect(syncEntities.length).toBe(1);
          expect(syncEntities[0].entityId).toEqual(entity2._id);
        });
    });
  });

  describe('pendingSyncCount()', () => {
    it('should return the count of entities waiting to be synced', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

  describe('pendingSyncEntities()', () => {
    it('should return the entities waiting to be synced', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
      const entity = {};

      return syncStore.save(entity)
        .then((entity) => {
          const query = new Query().equalTo('_id', entity._id);
          return store.pendingSyncEntities(query)
            .then((entities) => {
              expect(entities[0]).toIncludeKey('_id');
              expect(entities[0].collection).toEqual(collection);
              expect(entities[0].entityId).toEqual(entity._id);
              expect(entities[0].state).toEqual({ operation: SyncEvent.Create });
            });
        });
    });
  });

  describe('push()', () => {
    it('should push the entities to the backend', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
      const entity = { _id: randomString() };
      store.pathname = `/appdata/${client.appKey}/${collection}`
      
      return syncStore.save(entity)
        .then(() => {
          nock(client.apiHostname)
            .put(`${store.pathname}/${entity._id}`, entity)
            .reply(200, entity);

          return store.push();
        })
        .then((result) => {
          expect(result).toEqual([{ _id: entity._id, operation: SyncEvent.Update, entity: entity }]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(0);
        });
    });
  });

  describe('pull()', () => {
    it('should save entities from the backend to the cache', () => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true})

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false})
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity1, entity2]);
        })
    });

    it('should perform a delta set request', () => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, null, { useDeltaSet: true, autoSync: true });
      const lastRequestDate = new Date();

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2], {
          'X-Kinvey-Request-Start': lastRequestDate.toISOString()
        });

      return store.pull()
        .then(() => {
          const changedEntity2 = Object.assign({}, entity2, { title: 'test' });
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
            .query({ since: lastRequestDate.toISOString() })
            .reply(200, { changed: [changedEntity2], deleted: [{ _id: entity1._id }] }, {
              'X-Kinvey-Request-Start': new Date().toISOString()
            });

          store.pull()
            .then((count) => {
              expect(count).toEqual(1);
            });
        });
    });

    it('should perform a delta set request with a tagged datastore', () => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(client.appKey, collection, randomString(), { useDeltaSet: true, autoSync: true });
      const lastRequestDate = new Date();

      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2], {
          'X-Kinvey-Request-Start': lastRequestDate.toISOString()
        });

      return store.pull()
        .then(() => {
          const changedEntity2 = Object.assign({}, entity2, { title: 'test' });
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
            .query({ since: lastRequestDate.toISOString() })
            .reply(200, { changed: [changedEntity2], deleted: [{ _id: entity1._id }] }, {
              'X-Kinvey-Request-Start': new Date().toISOString()
            });

          store.pull()
            .then((count) => {
              expect(count).toEqual(1);
            });
        });
    });
  });

  describe('sync()', () => {
    it('should push any pending sync entities and then pull entities from the backend and save them to the cache', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true})
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false})
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      store.pathname = `/appdata/${client.appKey}/${collection}`

      return syncStore.save(entity1)
        .then(() => {
          nock(client.apiHostname)
            .put(`${store.pathname}/${entity1._id}`, entity1)
            .reply(200, entity1);

          nock(client.apiHostname)
            .get(store.pathname)
            .reply(200, [entity1, entity2]);

          return store.sync();
        })
        .then((result) => {
          expect(result.push).toEqual([{ _id: entity1._id, operation: SyncEvent.Update, entity: entity1 }]);
          expect(result.pull).toEqual(2);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(0);
        });
    });
  });

  describe('clearSync()', () => {
    it('should clear the sync table', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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

    it('should clear only the entities from the sync table matching the query', () => {
      const store = new CacheStore(client.appKey, collection, null, {autoSync: true});
      const syncStore = new CacheStore(client.appKey, collection, null, {autoSync: false});
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
