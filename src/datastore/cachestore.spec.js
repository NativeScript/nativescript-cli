import nock from 'nock';
import expect from 'expect';
import Query from '../query';
import Aggregation from '../aggregation';
import KinveyError from '../errors/kinvey';
import NotFoundError from '../errors/notFound';
import ServerError from '../errors/server';
import BadRequestError from '../errors/badRequest';
import init from '../kinvey/init';
import { CacheStore } from './cachestore';
import { set as setSession } from '../user/session';
import { SyncEvent } from './sync';

const collection = 'Books';
const pendingPushEntitiesErrMsg = 'Unable to pull entities from the backend. There is 1 entity that needs to be pushed to the backend.';

function uid(size = 10) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function randomString(size = 18, prefix = '') {
  return `${prefix}${uid(size)}`;
}

describe('CacheStore', () => {
  let client;

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString(),
      apiHostname: "https://baas.kinvey.com",
      micHostname: "https://auth.kinvey.com"
    });
  });

  before(() => {
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
    const store = new CacheStore(collection);
    return store.clear();
  });

  describe('pathname', () => {
    it(`should equal /appdata/<appkey>/${collection}`, () => {
      const store = new CacheStore(collection, { autoSync: true });
      expect(store.pathname).toEqual(`/appdata/${client.appKey}/${collection}`);
    });

    it('should not be able to be changed', () => {
      expect(() => {
        const store = new CacheStore(collection, { autoSync: true });
        store.pathname = `/tests/${collection}`;
      }).toThrow(TypeError, /which has only a getter/);
    });
  });

  describe('find()', () => {
    it('should throw an error if the query argument is not an instance of the Query class', (done) => {
      const store = new CacheStore(collection, { autoSync: true });
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
      const syncStore = new CacheStore(collection, { autoSync: false });
      syncStore.save(entity)
        .then(() => {
          const store = new CacheStore(collection, { autoSync: true });
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

    it('should return the entities', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: true });
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
                const syncStore = new CacheStore(collection, { autoSync: false });
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
      const store = new CacheStore(collection, { autoSync: true });
      const query = new Query().equalTo('_id', entity1._id);
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(client.apiHostname)
            .get(store.pathname)
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

    it('should return the entities that match the query but don\'t contain all matching properties', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: true });
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          const name = randomString();
          const entity3 = { _id: randomString(), name };
          const query = new Query().equalTo('name', name);

          nock(client.apiHostname)
            .get(store.pathname)
            .query(query.toQueryString())
            .reply(200, [entity3]);

          store.find(query)
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity3]]);
                done();
              } catch (error) {
                done(error);
              }
            });
        });
    });

    it('should remove entities that no longer exist on the backend from the cache', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: true });
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
            .reply(200, [entity1, entity3]);

          store.find()
            .subscribe(onNextSpy, done, () => {
              try {
                expect(onNextSpy.calls.length).toEqual(2);
                expect(onNextSpy.calls[0].arguments).toEqual([[entity1, entity2]]);
                expect(onNextSpy.calls[1].arguments).toEqual([[entity1, entity3]]);

                onNextSpy.reset();
                const syncStore = new CacheStore(collection, { autoSync: false });
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

    it('should add kinveyfile_ttl query parameter', () => {
      const store = new CacheStore('comecollection', { autoSync: true });
      const entity1 = { _id: randomString() };
      nock(client.apiHostname)
        .get(store.pathname)
        .query({ kinveyfile_ttl: 3600 })
        .reply(200, [entity1]);

      return store.find(null, { kinveyFileTTL: 3600 }).toPromise()
        .then((entities) => {
          expect(entities).toEqual([entity1]);
        });
    });

    it('should add kinveyfile_tls query parameter', () => {
      const store = new CacheStore('comecollection', { autoSync: true });
      const entity1 = { _id: randomString() };
      nock(client.apiHostname)
        .get(store.pathname)
        .query({ kinveyfile_tls: true })
        .reply(200, [entity1]);

      return store.find(null, { kinveyFileTLS: true }).toPromise()
        .then((entities) => {
          expect(entities).toEqual([entity1]);
        });
    });

    describe('Delta Set', () => {
      it('should find the entities', (done) => {
        const entity1 = { _id: randomString() };
        const entity2 = { _id: randomString() };
        const store = new CacheStore(collection, { useDeltaSet: true, autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();

        nock(client.apiHostname)
          .get(store.pathname)
          .reply(200, [entity1, entity2], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull()
          .then(() => {
            const changedEntity2 = Object.assign({}, entity2, { title: 'test' });
            nock(client.apiHostname)
              .get(`${store.pathname}/_deltaset`)
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
        const store = new CacheStore(collection, { useDeltaSet: true, autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();
        const query = new Query().equalTo('title', 'Test');

        nock(client.apiHostname)
          .get(store.pathname)
          .query(query.toQueryString())
          .reply(200, [entity1, entity2], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull(query)
          .then(() => {
            const changedEntity2 = Object.assign({}, entity2, { author: 'Kinvey' });
            nock(client.apiHostname)
              .get(`${store.pathname}/_deltaset`)
              .query(Object.assign({}, { since: lastRequestDate.toISOString() }, query.toQueryString()))
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
        const store = new CacheStore(collection, { useDeltaSet: true, autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();
        const query = new Query();
        query.skip = 1;

        nock(client.apiHostname)
          .get(store.pathname)
          .query(query.toQueryString())
          .reply(200, [entity1], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull(query)
          .then(() => {
            nock(client.apiHostname)
              .get(store.pathname)
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
        const store = new CacheStore(collection, { useDeltaSet: true, autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();
        const query = new Query();
        query.limit = 1;

        nock(client.apiHostname)
          .get(store.pathname)
          .query(query.toQueryString())
          .reply(200, [entity1], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull(query)
          .then(() => {
            nock(client.apiHostname)
              .get(store.pathname)
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
        const store = new CacheStore(collection, { useDeltaSet: true, autoSync: true, tag: randomString() });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();

        nock(client.apiHostname)
          .get(store.pathname)
          .reply(200, [entity1, entity2], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull()
          .then(() => {
            const changedEntity2 = Object.assign({}, entity2, { title: 'test' });
            nock(client.apiHostname)
              .get(`${store.pathname}/_deltaset`)
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

      it('should send regular GET request with outdated lastRequest', (done) => {
        const entity1 = { _id: randomString() };
        const entity2 = { _id: randomString() };
        const store = new CacheStore(collection, { useDeltaSet: true, autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();
        lastRequestDate.setDate(new Date().getDate() - 31);

        nock(client.apiHostname)
          .get(store.pathname)
          .reply(200, [entity1, entity2], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull()
          .then(() => {
            nock(client.apiHostname)
              .get(`${store.pathname}/_deltaset`)
              .query({ since: lastRequestDate.toISOString() })
              .reply(400, {
                debug: "The 'since' timestamp must be within the past 1 days.",
                description: "The value specified for one of the request parameters is out of range",
                error: "ParameterValueOutOfRange"
              });

            nock(client.apiHostname)
              .get(store.pathname)
              .reply(200, [entity1, entity2], {
                'X-Kinvey-Request-Start': lastRequestDate.toISOString()
              });
            store.find()
              .subscribe(onNextSpy, done, () => {
                try {
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

      it('should send regular GET request when configuration is missing on the backend', function (done) {
        const entity1 = { _id: randomString() };
        const entity2 = { _id: randomString() };
        const store = new CacheStore(collection, { useDeltaSet: true, autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();
        const firstNock = nock(client.apiHostname)
          .get(store.pathname)
          .reply(200, [entity1, entity2], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull()
          .then(() => {
            firstNock.done();
            const secondNock = nock(client.apiHostname)
              .get(`${store.pathname}/_deltaset`)
              .query({ since: lastRequestDate.toISOString() })
              .reply(403, {
                "error": "MissingConfiguration",
                "description": "This feature is not properly configured for this app backend. Please configure it through the console first, or contact support for more information.",
                "debug": "This collection has not been configured for Delta Set access."
              });

            const thirdNock = nock(client.apiHostname)
              .get(store.pathname)
              .reply(200, [entity1, entity2], {
                'X-Kinvey-Request-Start': lastRequestDate.toISOString()
              });
            store.find()
              .subscribe(onNextSpy, done, () => {
                try {
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

      it('should return error if more than 10000 items are changed', function (done) {
        const entity1 = { _id: randomString() };
        const entity2 = { _id: randomString() };
        const store = new CacheStore(collection, { useDeltaSet: true, autoSync: true });
        const onNextSpy = expect.createSpy();
        const lastRequestDate = new Date();

        nock(client.apiHostname)
          .get(store.pathname)
          .reply(200, [entity1, entity2], {
            'X-Kinvey-Request-Start': lastRequestDate.toISOString()
          });

        store.pull()
          .then(() => {
            nock(client.apiHostname)
              .get(`${store.pathname}/_deltaset`)
              .query({ since: lastRequestDate.toISOString() })
              .reply(400, {
                error: "BadRequest",
                description: "Unable to understand request",
                debug: "ResultSetSizeExceeded"
              });
            store.find()
              .subscribe(null, (error) => {
                try {
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
  });

  describe('findById()', () => {
    it('should return undefined if an id is not provided', (done) => {
      const store = new CacheStore(collection, { autoSync: true });
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

    it('should throw an error if there are entities to sync', (done) => {
      const entity = { _id: randomString() };
      const syncStore = new CacheStore(collection, { autoSync: false });
      syncStore.save(entity)
        .then(() => {
          const store = new CacheStore(collection, { autoSync: true });
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

    it('should throw a NotFoundError if the entity does not exist on the backend', (done) => {
      const entity = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: true });
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(`${store.pathname}/${entity._id}`)
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

    it('should return the entity that matches the id', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: true });
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(client.apiHostname)
            .get(`${store.pathname}/${entity1._id}`)
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

    it('should remove entities that no longer exist on the backend from the cache', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: true });
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(client.apiHostname)
            .get(`${store.pathname}/${entity1._id}`)
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
    it('should throw an error if the query argument is not an instance of the Query class', (done) => {
      const store = new CacheStore(collection, { autoSync: true });
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

    it('should throw a ServerError', (done) => {
      const store = new CacheStore(collection, { autoSync: true });
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

    it('should return the count of all unique properties on the collection', (done) => {
      const entity1 = { _id: randomString(), title: randomString() };
      const entity2 = { _id: randomString(), title: randomString() };
      const store = new CacheStore(collection, { autoSync: true });
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
      const store = new CacheStore(collection, { autoSync: true });
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

    it('should throw a ServerError', (done) => {
      const store = new CacheStore(collection, { autoSync: true });

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

    it('should return the count for the collection', (done) => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: true });
      const onNextSpy = expect.createSpy();

      nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      store.pull()
        .then(() => {
          nock(client.apiHostname)
            .get(`${store.pathname}/_count`)
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
    it('should throw an error if trying to create an array of entities', () => {
      const store = new CacheStore(collection, { autoSync: true });
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
      const store = new CacheStore(collection, { autoSync: true });
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
          const syncStore = new CacheStore(collection, { autoSync: false });
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

    it('should create an entity if it contains an _id', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const entity = { _id: randomString() };

      nock(client.apiHostname)
        .post(store.pathname, entity)
        .reply(200, entity);

      return store.create(entity)
        .then((createdEntity) => {
          expect(createdEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new CacheStore(collection, { autoSync: false });
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

    it('should send custom properties in x-kinvey-custom-request-properties header', async () => {
      const store = new CacheStore(collection, { autoSync: true });
      const entity = { _id: randomString() };
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
          const syncStore = new CacheStore(collection, { autoSync: false });
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
      const store = new CacheStore(collection, { autoSync: true });
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
      const store = new CacheStore(collection, { autoSync: true });
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
      const store = new CacheStore(collection, { autoSync: true });
      const entity = { _id: randomString() };

      nock(client.apiHostname)
        .put(`${store.pathname}/${entity._id}`, entity)
        .reply(200, entity);

      return store.update(entity)
        .then((updatedEntity) => {
          expect(updatedEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new CacheStore(collection, { autoSync: false });
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
      const store = new CacheStore(collection, { autoSync: true });
      const entity = { _id: randomString() };
      const properties = { a: 'b' };

      nock(client.apiHostname, {
        reqheaders: {
          'x-kinvey-custom-request-properties': JSON.stringify(properties)
        }
      })
        .put(`${store.pathname}/${entity._id}`, entity)
        .reply(200, entity);

      return store.update(entity, { properties })
        .then((updatedEntity) => {
          expect(updatedEntity).toEqual(entity);

          // Check the cache to make sure the entity was
          // stored in the cache
          const syncStore = new CacheStore(collection, { autoSync: false });
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
      const store = new CacheStore(collection, { autoSync: true });
      const spy = expect.spyOn(store, 'create');
      const entity = {};
      const options = {};
      store.save(entity, options);
      expect(spy).toHaveBeenCalledWith(entity, options);
    });

    it('should call update() for an entity that contains an _id', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const spy = expect.spyOn(store, 'update');
      const entity = { _id: randomString() };
      const options = {};
      store.save(entity, options);
      expect(spy).toHaveBeenCalledWith(entity, options);
    });

    it('should call create() when an array of entities is provided', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const spy = expect.spyOn(store, 'create');
      store.save([{ _id: randomString() }, {}]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('should throw an error if the query argument is not an instance of the Query class', () => {
      const store = new CacheStore(collection, { autoSync: true });
      return store.remove({})
        .then(() => Promise.reject(new Error('This should not happen.')))
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
        });
    });

    it('should return a { count: 0 } when no entities are removed', () => {
      const store = new CacheStore(collection, { autoSync: true });

      nock(client.apiHostname)
        .delete(store.pathname)
        .reply(200);

      return store.remove()
        .then((result) => {
          expect(result).toEqual({ count: 0 });
        });
    });

    it('should remove all the entities', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      nock(client.apiHostname)
        .delete(`${store.pathname}/${entity1._id}`)
        .reply(200);

      nock(client.apiHostname)
        .delete(`${store.pathname}/${entity2._id}`)
        .reply(200);

      return store.pull()
        .then(() => store.remove())
        .then((result) => {
          expect(result).toEqual({ count: 2 });
          const syncStore = new CacheStore(collection, { autoSync: false });
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

    it('should remove all the entities that match the query', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => {
          const query = new Query().equalTo('_id', entity1._id);

          nock(client.apiHostname)
            .delete(`${store.pathname}/${entity1._id}`)
            .query(true)
            .reply(200);

          return store.remove(query);
        })
        .then((result) => {
          expect(result).toEqual({ count: 1 });
          const syncStore = new CacheStore(collection, { autoSync: false });
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

    it('should not remove the entity from the cache if the backend request failed', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

      const pullScope = nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      const deleteScope = nock(client.apiHostname)
        .delete(`${store.pathname}/${entity1._id}`)
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
          const syncStore = new CacheStore(collection, { autoSync: false });
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([entity2]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(1);
        });
    });

    it('should remove an entity if it was created locally', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const syncStore = new CacheStore(collection, { autoSync: false });
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const entity3 = {};
      nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => syncStore.save(entity3))
        .then(() => {
          nock(client.apiHostname)
            .delete(`${store.pathname}/${entity1._id}`)
            .reply(200);

          nock(client.apiHostname)
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

  describe('removeById()', () => {
    it('should return a { count: 0 } if an id is not provided', () => {
      const store = new CacheStore(collection, { autoSync: true });
      return store.removeById()
        .then((result) => {
          expect(result).toEqual({ count: 0 });
        });
    });

    it('should remove the entity from cache if the entity is not found on the backend', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const entity = { _id: randomString() };

      const pullScope = nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity]);

      const deleteScope = nock(client.apiHostname)
        .delete(`${store.pathname}/${entity._id}`)
        .reply(404);

      return store.pull()
        .then(() => {
          pullScope.done();
          return store.removeById(entity._id);
        })
        .then((result) => {
          deleteScope.done();
          expect(result).toEqual({ count: 1 });
          const syncStore = new CacheStore(collection, { autoSync: false });
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

    it('should remove the entity from the backend', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const entity = { _id: randomString() };

      const pullScope = nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity]);

      const deleteScope = nock(client.apiHostname)
        .delete(`${store.pathname}/${entity._id}`)
        .reply(200, { count: 1 });

      return store.pull()
        .then(() => {
          pullScope.done();
          return store.removeById(entity._id);
        })
        .then((result) => {
          deleteScope.done();
          expect(result).toEqual({ count: 1 });
          const syncStore = new CacheStore(collection, { autoSync: false });
          const query = new Query().equalTo('_id', entity._id);
          return syncStore.find(query).toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove the entity from the cache and sync table and not make a request for a local entity', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const syncStore = new CacheStore(collection, { autoSync: false });
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

  describe('clear()', () => {
    it('should remove all entities only from the cache', () => {
      const store = new CacheStore(collection, { autoSync: true });
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
          const syncStore = new CacheStore(collection, { autoSync: false });
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should remove only the entities from the cache that match the query', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const syncStore = new CacheStore(collection, { autoSync: false });
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
      const store = new CacheStore(collection, { autoSync: true });
      const syncStore = new CacheStore(collection, { autoSync: false });

      return Promise.all([{}, {}].map((entity) => syncStore.save(entity)))
        .then((entities) => {
          const entity = entities.shift();
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
      const store = new CacheStore(collection, { autoSync: true });
      const syncStore = new CacheStore(collection, { autoSync: false });

      return Promise.all([{}, {}].map((entity) => syncStore.save(entity)))
        .then((entities) => {
          const entity = entities.shift();
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
      const store = new CacheStore(collection, { autoSync: true });
      const syncStore = new CacheStore(collection, { autoSync: false });
      const entity = { _id: randomString() };

      return syncStore.save(entity)
        .then(() => {
          nock(client.apiHostname)
            .put(`${store.pathname}/${entity._id}`, entity)
            .reply(200, entity);

          return store.push();
        })
        .then((result) => {
          expect(result).toEqual([{ _id: entity._id, operation: SyncEvent.Update, entity }]);
          return store.pendingSyncCount();
        })
        .then((count) => {
          expect(count).toEqual(0);
        });
    });
  });

  describe('pull()', () => {
    beforeEach(() => {
      const store = new CacheStore(collection, { autoSync: true });
      return store.clear();
    });

    it('should save entities from the backend to the cache', () => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: true })

      nock(client.apiHostname)
        .get(store.pathname)
        .reply(200, [entity1, entity2]);

      return store.pull()
        .then(() => {
          const syncStore = new CacheStore(collection, { autoSync: false })
          return syncStore.find().toPromise();
        })
        .then((entities) => {
          return expect(entities).toEqual([entity1, entity2]);
        });
    });

    it('should perform a delta set request', () => {
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };
      const store = new CacheStore(collection, { useDeltaSet: true, autoSync: true });
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
      const store = new CacheStore(collection, { useDeltaSet: true, autoSync: true, tag: randomString() });
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

    it('should return entities from the backend', () => {
      const entity = { _id: randomString() };
      const store = new CacheStore(collection, { autoSync: true });

      // Kinvey API Response
      nock(client.apiHostname)
        .get(store.pathname, () => true)
        .query(true)
        .reply(200, [entity]);

      return store.pull()
        .then((entities) => {
          expect(entities).toBe(1);
        });
    });

    it('should add kinveyfile_ttl query parameter', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const entity1 = { _id: randomString() };

      nock(client.apiHostname)
        .get(store.pathname)
        .query({ kinveyfile_ttl: 3600 })
        .reply(200, [entity1]);

      return store.pull(null, { kinveyFileTTL: 3600 })
        .then((entities) => {
          expect(entities).toBe(1);
        });
    });

    it('should add kinveyfile_tls query parameter', () => {
      const store = new CacheStore(collection, { autoSync: true });
      const entity1 = { _id: randomString() };

      nock(client.apiHostname)
        .get(store.pathname)
        .query({ kinveyfile_tls: true })
        .reply(200, [entity1]);

      return store.pull(null, { kinveyFileTLS: true })
        .then((entities) => {
          expect(entities).toBe(1);
        });
    });
  });

  describe('sync()', () => {
    it('should push any pending sync entities and then pull entities from the backend and save them to the cache', () => {
      const store = new CacheStore(collection, { autoSync: true })
      const syncStore = new CacheStore(collection, { autoSync: false })
      const entity1 = { _id: randomString() };
      const entity2 = { _id: randomString() };

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
      const store = new CacheStore(collection, { autoSync: true });
      const syncStore = new CacheStore(collection, { autoSync: false });
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
      const store = new CacheStore(collection, { autoSync: true });
      const syncStore = new CacheStore(collection, { autoSync: false });
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
