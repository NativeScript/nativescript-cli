import { SyncStore } from 'src/datastore';
import Client from 'src/client';
import Query from 'src/query';
import { KinveyError, NotFoundError } from 'src/errors';
import { randomString } from 'src/utils';
import nock from 'nock';
import expect from 'expect';
const collection = 'Books';

describe('SyncStore', function() {
  // Get the sared client instance
  before(function() {
    this.client = Client.sharedInstance();
  });

  // Cleanup
  after(function() {
    delete this.client;
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
    it('should be false', function() {
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
    const entity1 = {
      _id: randomString(),
      title: 'Opela',
      isbn: 2,
      author: 'Maria Crawford',
      summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      _acl: {
        creator: 'kid_HkTD2CJc'
      },
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString()
      }
    };
    const entity2 = {
      _id: randomString(),
      title: 'Treeflex',
      isbn: 1,
      author: 'Harry Larson',
      summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
      _acl: {
        creator: 'kid_HkTD2CJc'
      },
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString()
      }
    };
    const entity3 = {
      _id: randomString(),
      title: 'Random',
      author: 'Bruce Lee',
      isbn: 1,
      summary: 'Loren ipsum dolor si...',
      _acl: {
        creator: 'kid_HkTD2CJc'
      },
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString()
      }
    };

    beforeEach(function() {
      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2, entity3], {
          'content-type': 'application/json',
          'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
          'x-kinvey-api-version': '4'
        });

      // Pull data into cache
      const store = new SyncStore(collection);
      return store.pull();
    });

    afterEach(function() {
      // Clear the cache
      const store = new SyncStore(collection);
      return store.clear();
    });

    it('should return all the entities in cache', async function() {
      const store = new SyncStore(collection);
      const entities = await store.find().toPromise();
      expect(entities).toEqual([entity1, entity2, entity3]);
    });

    it('should execute a limit query on cache', async function() {
      const store = new SyncStore(collection);
      const query = new Query();
      query.limit = 1;
      const entities = await store.find(query).toPromise();
      expect(entities.length).toEqual(1);
      expect(entities).toEqual([entity1]);
    });

    it('should execute a skip query on cache', async function() {
      const store = new SyncStore(collection);
      const query = new Query();
      query.skip = 1;
      const entities = await store.find(query).toPromise();
      expect(entities).toEqual([entity2, entity3]);
    });

    it('should execute a sort ascending query on cache', async function() {
      const store = new SyncStore(collection);
      const query = new Query();
      query.ascending('summary');
      const entities = await store.find(query).toPromise();
      expect(entities).toEqual([entity2, entity3, entity1]);
    });

    it('should execute a sort query with multiple fields on cache', async function() {
      const store = new SyncStore(collection);
      const query = new Query();
      query.ascending('isbn');
      query.descending('summary');
      const entities = await store.find(query).toPromise();
      expect(entities).toEqual([entity3, entity2, entity1]);
    });

    it('should throw an error if the query argument is not an instance of the Query class', async function() {
      try {
        const store = new SyncStore(collection);
        await store.find({}).toPromise();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    it('should return all the entities in cache that match the query', async function() {
      const store = new SyncStore(collection);
      const query = new Query().equalTo('title', entity1.title);
      const entities = await store.find(query).toPromise();
      expect(entities).toEqual([entity1]);
    });
  });

  describe('findById()', function() {
    const entity1 = {
      _id: '57b48371319a67493dc50dba',
      title: 'Opela',
      author: 'Maria Crawford',
      isbn: '887420007-2',
      summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      _acl: {
        creator: 'kid_HkTD2CJc'
      },
      _kmd: {
        lmt: '2016-08-17T15:32:01.741Z',
        ect: '2016-08-17T15:32:01.741Z'
      }
    };
    const entity2 = {
      _id: '57b48371b262874d7e2f0a99',
      title: 'Treeflex',
      author: 'Harry Larson',
      isbn: '809087960-8',
      summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
      _acl: {
        creator: 'kid_HkTD2CJc'
      },
      _kmd: {
        lmt: '2016-08-17T15:32:01.744Z',
        ect: '2016-08-17T15:32:01.744Z'
      }
    };

    beforeEach(function() {
      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2], {
          'content-type': 'application/json',
          'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
          'x-kinvey-api-version': '4'
        });

      // Pull data into cache
      const store = new SyncStore(collection);
      return store.pull();
    });

    afterEach(function() {
      // Clear the cache
      const store = new SyncStore(collection);
      return store.clear();
    });

    it('should throw a NotFoundError if the id argument is not a string', async function() {
      try {
        const store = new SyncStore(collection);
        await store.findById({}).toPromise();
      } catch (error) {
        expect(error).toBeA(NotFoundError);
      }
    });

    it('should throw a NotFoundError if the id argument does not exist', async function() {
      try {
        const store = new SyncStore(collection);
        await store.findById(randomString()).toPromise();
      } catch (error) {
        expect(error).toBeA(NotFoundError);
      }
    });

    it('should return the entity that matches the id argument', async function() {
      const store = new SyncStore(collection);
      const entity = await store.findById(entity1._id).toPromise();
      expect(entity).toEqual(entity1);
    });
  });

  describe('create()', function() {
    it('should create an entity in cache and add it to the sync table', function() {
      // Create an entitiy
      const store = new SyncStore(collection);
      const entity1 = {
        title: 'Opela',
        author: 'Maria Crawford',
        isbn: '887420007-2',
        summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      };
      return store.create(entity1)
        .then((result) => {
          expect(result._id).toExist();
          expect(result.title).toEqual(entity1.title);
          expect(result.author).toEqual(entity1.author);
          expect(result.isbn).toEqual(entity1.isbn);
          expect(result.summary).toEqual(entity1.summary);

          // Check the sync entities
          const query = new Query().equalTo('entityId', result._id);
          return store.pendingSyncEntities(query)
            .then((syncEntities) => {
              expect(syncEntities[0]).toEqual({
                collection: collection,
                state: { method: 'POST' },
                entityId: result._id,
                _id: syncEntities[0]._id,
                _kmd: { local: true }
              });

              // Clear the store
              return store.clear();
            });
        });
    });

    it('should create an entity that contains an _id in cache and add it to the sync table', function() {
      // Create an entitiy
      const store = new SyncStore(collection);
      const entity1 = {
        _id: '57b48371319a67493dc50dba',
        title: 'Opela',
        author: 'Maria Crawford',
        isbn: '887420007-2',
        summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      };
      return store.create(entity1)
        .then((result) => {
          expect(result._id).toEqual(entity1._id);
          expect(result.title).toEqual(entity1.title);
          expect(result.author).toEqual(entity1.author);
          expect(result.isbn).toEqual(entity1.isbn);
          expect(result.summary).toEqual(entity1.summary);

          // Check the sync entities
          const query = new Query().equalTo('entityId', result._id);
          return store.pendingSyncEntities(query)
            .then((syncEntities) => {
                expect(syncEntities[0]).toEqual({
                  collection: collection,
                  state: { method: 'POST' },
                  entityId: result._id,
                  _id: syncEntities[0]._id,
                  _kmd: { local: true }
                });

                // Clear the store
                return store.clear();
              });
          });
    });

    it('should create an array of entities in cache and add them to the sync table', function() {
      // Create entities
      const store = new SyncStore(collection);
      const entity1 = {
        title: 'Alphazap',
        author: 'Walter Nguyen',
        isbn: '750320687-X',
        summary: 'Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
      };
      const entity2 = {
        title: 'Treeflex',
        author: 'Harry Larson',
        isbn: '809087960-8',
        summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.'
      };
      return store.create([entity1, entity2])
        .then((result) => {
          expect(result[0]._id).toExist();
          expect(result[0].title).toEqual(entity1.title);
          expect(result[0].author).toEqual(entity1.author);
          expect(result[0].isbn).toEqual(entity1.isbn);
          expect(result[0].summary).toEqual(entity1.summary);
          expect(result[1]._id).toExist();
          expect(result[1].title).toEqual(entity2.title);
          expect(result[1].author).toEqual(entity2.author);
          expect(result[1].isbn).toEqual(entity2.isbn);
          expect(result[1].summary).toEqual(entity2.summary);

          // Check the sync entities
          let query = new Query().equalTo('entityId', result[0]._id);
          return store.pendingSyncEntities(query)
            .then((syncEntities) => {
              expect(syncEntities[0]).toEqual({
                collection: collection,
                state: { method: 'POST' },
                entityId: result[0]._id,
                _id: syncEntities[0]._id,
                _kmd: { local: true }
              });

              // Check the sync entities
              query = new Query().equalTo('entityId', result[1]._id);
              return store.pendingSyncEntities(query);
            })
            .then((syncEntities) => {
              expect(syncEntities[0]).toEqual({
                collection: collection,
                state: { method: 'POST' },
                entityId: result[1]._id,
                _id: syncEntities[0]._id,
                _kmd: { local: true }
              });

              // Clear the store
              return store.clear();
            });
        });
    });
  });

  describe('update()', function() {
    it('should update an entity in cache and add it to the sync table', function() {
      // Update an entitiy
      const store = new SyncStore(collection);
      const entity1 = {
        _id: '57b48371319a67493dc50dba',
        title: 'Opela',
        author: 'Maria Crawford',
        isbn: '887420007-2',
        summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      };
      return store.update(entity1)
        .then((result) => {
          expect(result._id).toEqual(entity1._id);
          expect(result.title).toEqual(entity1.title);
          expect(result.author).toEqual(entity1.author);
          expect(result.isbn).toEqual(entity1.isbn);
          expect(result.summary).toEqual(entity1.summary);

          // Check the sync entities
          const query = new Query().equalTo('entityId', result._id);
          return store.pendingSyncEntities(query)
            .then((syncEntities) => {
              expect(syncEntities[0]).toEqual({
                collection: collection,
                state: { method: 'PUT' },
                entityId: result._id,
                _id: syncEntities[0]._id,
                _kmd: { local: true }
              });

              // Clear the store
              return store.clear();
            });
        });
    });

    it('should update an entity that does not contain an _id in cache and add it to the sync table', function() {
      // Update an entitiy
      const store = new SyncStore(collection);
      const entity1 = {
        title: 'Opela',
        author: 'Maria Crawford',
        isbn: '887420007-2',
        summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      };
      return store.update(entity1)
        .then((result) => {
          expect(result._id).toExist();
          expect(result.title).toEqual(entity1.title);
          expect(result.author).toEqual(entity1.author);
          expect(result.isbn).toEqual(entity1.isbn);
          expect(result.summary).toEqual(entity1.summary);

          // Check the sync entities
          const query = new Query().equalTo('entityId', result._id);
          return store.pendingSyncEntities(query)
            .then((syncEntities) => {
              expect(syncEntities[0]).toEqual({
                collection: collection,
                state: { method: 'PUT' },
                entityId: result._id,
                _id: syncEntities[0]._id,
                _kmd: { local: true }
              });

              // Clear the store
              return store.clear();
            });
        });
    });

    it('should update an array of entities in cache and add them to the sync table', function() {
      // Update entities
      const store = new SyncStore(collection);
      const entity1 = {
        title: 'Alphazap',
        author: 'Walter Nguyen',
        isbn: '750320687-X',
        summary: 'Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
      };
      const entity2 = {
        _id: '57b48371b262874d7e2f0a99',
        title: 'Treeflex',
        author: 'Harry Larson',
        isbn: '809087960-8',
        summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.'
      };
      return store.update([entity1, entity2])
        .then((result) => {
          expect(result[0]._id).toExist();
          expect(result[0].title).toEqual(entity1.title);
          expect(result[0].author).toEqual(entity1.author);
          expect(result[0].isbn).toEqual(entity1.isbn);
          expect(result[0].summary).toEqual(entity1.summary);
          expect(result[1]._id).toEqual(entity2._id);
          expect(result[1].title).toEqual(entity2.title);
          expect(result[1].author).toEqual(entity2.author);
          expect(result[1].isbn).toEqual(entity2.isbn);
          expect(result[1].summary).toEqual(entity2.summary);

          // Check the sync entities
          let query = new Query().equalTo('entityId', result[0]._id);
          return store.pendingSyncEntities(query)
            .then((syncEntities) => {
              expect(syncEntities[0]).toEqual({
                collection: collection,
                state: { method: 'PUT' },
                entityId: result[0]._id,
                _id: syncEntities[0]._id,
                _kmd: { local: true }
              });

              // Check the sync entities
              query = new Query().equalTo('entityId', result[1]._id);
              return store.pendingSyncEntities(query);
            })
            .then((syncEntities) => {
              expect(syncEntities[0]).toEqual({
                collection: collection,
                state: { method: 'PUT' },
                entityId: result[1]._id,
                _id: syncEntities[0]._id,
                _kmd: { local: true }
              });

              // Clear the store
              return store.clear();
            });
        });
    });
  });

  describe('save()', function() {
    afterEach(function () {
      expect.restoreSpies();
    });

    it('should call create() for an entity that does not contain an _id', async function() {
      const store = new SyncStore(collection);
      const entity1 = {
        title: 'Opela',
        author: 'Maria Crawford',
        isbn: '887420007-2',
        summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      };
      const spy = expect.spyOn(store, 'create');

      // Save an entitiy
      await store.save(entity1);
      expect(spy).toHaveBeenCalled();

      // Clear the store
      await store.clear();
    });

    it('should call update() for an entity that contains an _id', async function() {
      const store = new SyncStore(collection);
      const entity1 = {
        _id: '57b48371319a67493dc50dba',
        title: 'Opela',
        author: 'Maria Crawford',
        isbn: '887420007-2',
        summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      };
      const spy = expect.spyOn(store, 'update');

      // Save an entitiy
      await store.save(entity1);
      expect(spy).toHaveBeenCalled();

      // Clear the store
      await store.clear();
    });

    it('should call create() when an array of entities is provided', async function() {
      const store = new SyncStore(collection);
      const entity1 = {
        title: 'Alphazap',
        author: 'Walter Nguyen',
        isbn: '750320687-X',
        summary: 'Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
      };
      const entity2 = {
        _id: '57b48371b262874d7e2f0a99',
        title: 'Treeflex',
        author: 'Harry Larson',
        isbn: '809087960-8',
        summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.'
      };
      const spy = expect.spyOn(store, 'create');

      // Save the entities
      await store.save([entity1, entity2]);
      expect(spy).toHaveBeenCalled();

      // Clear the store
      await store.clear();
    });
  });

  describe('remove()', function() {
    const entity1 = {
      _id: '57b48371319a67493dc50dba',
      title: 'Opela',
      author: 'Maria Crawford',
      isbn: '887420007-2',
      summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      _acl: {
        creator: 'kid_HkTD2CJc'
      },
      _kmd: {
        lmt: '2016-08-17T15:32:01.741Z',
        ect: '2016-08-17T15:32:01.741Z'
      }
    };
    const entity2 = {
      _id: '57b48371b262874d7e2f0a99',
      title: 'Treeflex',
      author: 'Harry Larson',
      isbn: '809087960-8',
      summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
      _acl: {
        creator: 'kid_HkTD2CJc'
      },
      _kmd: {
        lmt: '2016-08-17T15:32:01.744Z',
        ect: '2016-08-17T15:32:01.744Z'
      }
    };

    beforeEach(function() {
      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2], {
          'content-type': 'application/json',
          'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
          'x-kinvey-api-version': '4'
        });

      // Pull data into cache
      const store = new SyncStore(collection);
      return store.pull();
    });

    afterEach(async function() {
      // Clear the cache
      const store = new SyncStore(collection);
      await store.clear();
    });

    it('should remove all entities from the cache', async function() {
      const store = new SyncStore(collection);

      // Remove the entities
      let entities = await store.remove();
      expect(entities).toEqual([entity1, entity2]);

      // Check that the entities were removed
      entities = await store.find().toPromise();
      expect(entities).toEqual([]);

      // Check the sync entities
      let query = new Query().equalTo('entityId', entity1._id);
      let syncEntities = await store.pendingSyncEntities(query);
      expect(syncEntities[0]).toEqual({
        collection: collection,
        state: { method: 'DELETE' },
        entityId: entity1._id,
        _id: syncEntities[0]._id,
        _kmd: { local: true }
      });

      // Check the sync entities
      query = new Query().equalTo('entityId', entity2._id);
      syncEntities = await store.pendingSyncEntities(query);
      expect(syncEntities[0]).toEqual({
        collection: collection,
        state: { method: 'DELETE' },
        entityId: entity2._id,
        _id: syncEntities[0]._id,
        _kmd: { local: true }
      });
    });

    it('should remove only the entities from the cache that match the query', async function() {
      const store = new SyncStore(collection);
      let query = new Query().equalTo('_id', entity1._id);

      // Remove the entity
      let entities = await store.remove(query);
      expect(entities).toEqual([entity1]);

      // Check that the entities were removed
      entities = await store.find().toPromise();
      expect(entities).toEqual([entity2]);

      // Check the sync entities
      query = new Query().equalTo('entityId', entity1._id);
      const syncEntities = await store.pendingSyncEntities(query);
      expect(syncEntities[0]).toEqual({
        collection: collection,
        state: { method: 'DELETE' },
        entityId: entity1._id,
        _id: syncEntities[0]._id,
        _kmd: { local: true }
      });
    });

    it('should remove an entity created offline from the sync table and cache', async function() {
      const store = new SyncStore(collection);
      let entity3 = {
        title: 'Treeflex',
        author: 'Harry Larson',
        isbn: '809087960-8',
        summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
      };

      // Save the entity
      entity3 = await store.save(entity3);

      // Check the sync entities
      let query = new Query().equalTo('entityId', entity3._id);
      let syncEntities = await store.pendingSyncEntities(query);
      expect(syncEntities[0]).toEqual({
        collection: collection,
        state: { method: 'POST' },
        entityId: entity3._id,
        _id: syncEntities[0]._id,
        _kmd: { local: true }
      });

      // Remove the entity
      query = new Query().equalTo('_id', entity3._id);
      let entities = await store.remove(query);
      expect(entities).toEqual([entity3]);

      // Check that the entity was removed
      entities = await store.find().toPromise();
      expect(entities).toEqual([entity1, entity2]);

      // Check the sync entities
      query = new Query().equalTo('entityId', entity3._id);
      syncEntities = await store.pendingSyncEntities(query);
      expect(syncEntities).toEqual([]);
    });
  });

  describe('removeById()', function() {
    const entity1 = {
      _id: '57b48371319a67493dc50dba',
      title: 'Opela',
      author: 'Maria Crawford',
      isbn: '887420007-2',
      summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      _acl: {
        creator: 'kid_HkTD2CJc'
      },
      _kmd: {
        lmt: '2016-08-17T15:32:01.741Z',
        ect: '2016-08-17T15:32:01.741Z'
      }
    };
    const entity2 = {
      _id: '57b48371b262874d7e2f0a99',
      title: 'Treeflex',
      author: 'Harry Larson',
      isbn: '809087960-8',
      summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
      _acl: {
        creator: 'kid_HkTD2CJc'
      },
      _kmd: {
        lmt: '2016-08-17T15:32:01.744Z',
        ect: '2016-08-17T15:32:01.744Z'
      }
    };

    beforeEach(function() {
      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2], {
          'content-type': 'application/json',
          'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
          'x-kinvey-api-version': '4'
        });

      // Pull data into cache
      const store = new SyncStore(collection);
      return store.pull();
    });

    afterEach(async function() {
      // Clear the cache
      const store = new SyncStore(collection);
      await store.clear();
    });

    it('should throw a NotFoundError if the id argument is not a string', async function() {
      try {
        const store = new SyncStore(collection);
        await store.removeById({});
      } catch (error) {
        expect(error).toBeA(NotFoundError);
      }
    });

    it('should throw a NotFoundError if the id argument does not exist', async function() {
      try {
        const store = new SyncStore(collection);
        await store.removeById(randomString());
      } catch (error) {
        expect(error).toBeA(NotFoundError);
      }
    });

    it('should remove the entity that matches the id argument', async function() {
      const store = new SyncStore(collection);

      // Remove the entity
      const result = await store.removeById(entity1._id);
      expect(result).toEqual(entity1);

      // Check that the entities were removed
      const entities = await store.find().toPromise();
      expect(entities).toEqual([entity2]);

      // Check the sync entities
      const query = new Query().equalTo('entityId', entity1._id);
      const syncEntities = await store.pendingSyncEntities(query);
      expect(syncEntities[0]).toEqual({
        collection: collection,
        state: { method: 'DELETE' },
        entityId: entity1._id,
        _id: syncEntities[0]._id,
        _kmd: { local: true }
      });
    });
  });

  describe('pull()', function() {
    it('should save entities from the backend in cache', async function() {
      const entity = {
        _id: randomString(),
        _kmd: {},
        prop: randomString()
      };
      const store = new SyncStore(collection);

      // Kinvey API Response
      nock(store.client.baseUrl)
        .get(store.pathname, () => true)
        .query(true)
        .reply(200, [entity], {
          'content-type': 'application/json'
        });

      await store.pull();
      const entities = await store.find().toPromise();
      expect(entities).toEqual([entity]);
    });

    it('should remove entities in cache when backend collection is empty', async function() {
      const store = new SyncStore(collection);
      const entity = {
        _id: randomString(),
        _kmd: {},
        prop: randomString()
      };

      // Kinvey API Response
      nock(store.client.baseUrl)
        .get(store.pathname, () => true)
        .query(true)
        .reply(200, [entity], {
          'content-type': 'application/json'
        });

      await store.pull();
      const entities1 = await store.find().toPromise();
      expect(entities1).toEqual([entity]);

      // Kinvey API Response
      nock(this.client.baseUrl)
        .get(store.pathname, () => true)
        .query(true)
        .reply(200, [], {
          'content-type': 'application/json'
        });

      await store.pull();
      const entities2 = await store.find().toPromise();
      expect(entities2).toEqual([]);
    });

    it('should update entities in cache when a query was provided', async function() {
      const store = new SyncStore(collection);
      const entity1 = {
        _id: randomString(),
        _kmd: {},
        prop: randomString()
      };
      const entity2 = {
        _id: randomString(),
        _kmd: {},
        prop: randomString()
      };
      const entity3 = {
        _id: randomString(),
        _kmd: {},
        prop: randomString()
      };

      // Kinvey API Response
      nock(store.client.baseUrl)
        .get(store.pathname, () => true)
        .query(true)
        .reply(200, [entity1, entity2, entity3], {
          'content-type': 'application/json'
        });

      await store.pull();
      const entities1 = await store.find().toPromise();
      expect(entities1).toEqual([entity1, entity2, entity3]);

      nock(this.client.baseUrl)
        .get(store.pathname, () => true)
        .query(true)
        .reply(200, [], {
          'content-type': 'application/json'
        });

      const query = new Query().equalTo('_id', entity1._id);
      await store.pull(query);
      const entities2 = await store.find().toPromise();
      expect(entities2).toEqual([entity2, entity3]);
    });
  });

  describe('push()', function() {
    it('should save an entity to the backend', async function() {
      const store = new SyncStore(collection);
      let entity = {
        prop: randomString()
      };
      entity = await store.save(entity);

      // Kinvey API Response
      nock(store.client.baseUrl)
        .post(store.pathname, () => true)
        .query(true)
        .reply(200, entity, {
          'content-type': 'application/json'
        });

      const result = await store.push();
      expect(result).toEqual([{ _id: entity._id, entity: entity }]);

      const syncCount = await store.syncCount();
      expect(syncCount).toEqual(0);
    });

    it('should delete an entity from the backend', async function() {
      const store = new SyncStore(collection);
      let entity = {
        _id: randomString(),
        prop: randomString()
      };
      entity = await store.save(entity);
      await store.removeById(entity._id);

      // Kinvey API Response
      nock(store.client.baseUrl)
        .delete(`${store.pathname}/${entity._id}`, () => true)
        .query(true)
        .reply(204);

      const result = await store.push();
      expect(result).toEqual([{ _id: entity._id }]);

      const syncCount = await store.syncCount();
      expect(syncCount).toEqual(0);
    });

    it('should not delete an entity on the network if it was created locally', async function() {
      const store = new SyncStore(collection);
      let entity = {
        prop: randomString()
      };
      entity = await store.save(entity);
      await store.removeById(entity._id);
      const result = await store.push();
      expect(result).toEqual([]);
    });

    it('should succeed after a failed push attempt when creating an entity', async function() {
      const store = new SyncStore(collection);
      let entity = {
        prop: randomString()
      };
      entity = await store.save(entity);

      // Kinvey API Response
      nock(store.client.baseUrl)
        .post(store.pathname, () => true)
        .query(true)
        .reply(500, '', {
          'content-type': 'application/json'
        });

      let result = await store.push();

      expect(result).toBeA(Array);
      expect(result.length).toEqual(1);
      expect(result[0]).toIncludeKey('error');

      // Kinvey API Response
      nock(store.client.baseUrl)
        .post(store.pathname, () => true)
        .query(true)
        .reply(201, entity, {
          'content-type': 'application/json'
        });

      result = await store.push();
      expect(result).toEqual([{ _id: entity._id, entity: entity }]);

      const syncCount = await store.syncCount();
      expect(syncCount).toEqual(0);
    });

    it('should succeed after a failed push attempt when updating an entity', async function() {
      const store = new SyncStore(collection);
      let entity = {
        _id: randomString(),
        prop: randomString()
      };
      entity = await store.save(entity);

      // Kinvey API Response
      nock(store.client.baseUrl)
        .put(`${store.pathname}/${entity._id}`, () => true)
        .query(true)
        .reply(500, '', {
          'content-type': 'application/json'
        });

      let result = await store.push();

      expect(result).toBeA(Array);
      expect(result.length).toEqual(1);
      expect(result[0]).toIncludeKey('error');

      // Kinvey API Response
      nock(store.client.baseUrl)
        .put(`${store.pathname}/${entity._id}`, () => true)
        .query(true)
        .reply(200, entity, {
          'content-type': 'application/json'
        });

      result = await store.push();
      expect(result).toEqual([{ _id: entity._id, entity: entity }]);

      const syncCount = await store.syncCount();
      expect(syncCount).toEqual(0);
    });
  });

  describe('sync()', function() {
    it('should push pending entities, then pull new entities', async function() {
      const store = new SyncStore(collection);
      let entity = {
        prop: randomString()
      };
      entity = await store.save(entity);
      const pendingCount = await store.syncCount();
      expect(pendingCount).toEqual(1);

      nock(store.client.baseUrl)
        .post(store.pathname, () => true)
        .query(true)
        .reply(200, entity, {
          'content-type': 'application/json'
        });

      nock(store.client.baseUrl)
        .get(store.pathname, () => true)
        .query(true)
        .reply(200, [entity], {
          'content-type': 'application/json'
        });

      const result = await store.sync();
      expect(result.pull).toEqual([entity]);
      expect(result.push).toEqual([{ _id: entity._id, entity: entity }]);

      const syncCount = await store.syncCount();
      expect(syncCount).toEqual(0);


    });
  });
});
