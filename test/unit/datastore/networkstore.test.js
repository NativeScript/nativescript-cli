import { NetworkStore } from 'src/datastore';
import Client from 'src/client';
import Query from 'src/query';
import Aggregation from 'src/aggregation';
import { KinveyError, NotFoundError } from 'src/errors';
import { randomString } from 'src/utils';
import nock from 'nock';
import expect from 'expect';
const collection = 'Books';

describe('NetworkStore', function() {
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
      const store = new NetworkStore(collection);
      expect(store.pathname).toEqual(`/appdata/${this.client.appKey}/${collection}`);
    });

    it('should not be able to be changed', function() {
      expect(() => {
        const store = new NetworkStore(collection);
        store.pathname = `/tests/${collection}`;
      }).toThrow();
    });
  });

  describe('find()', function() {
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

      // nock(this.client.apiHostname, { encodedQueryParams: true })
      //   .get(`/appdata/${this.client.appKey}/${collection}`?query=)
      //   .reply(200, [entity1, entity2], {
      //     'content-type': 'application/json',
      //     'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
      //     'x-kinvey-api-version': '4'
      //   });

    });

    afterEach(function() {
    });

    it('should return all the entities from the backend', async function() {
      const store = new NetworkStore(collection);
      const entities = await store.find().toPromise();
      expect(entities).toEqual([entity1, entity2]);
    });

    it('should throw an error if the query argument is not an instance of the Query class', async function() {
      try {
        const store = new NetworkStore(collection);
        await store.find({}).toPromise();
      } catch (error) {
        expect(error).toBeA(KinveyError);
      }
    });

    // it('should return all the entities from the backen that match the query', async function() {
    //   const store = new NetworkStore(collection);
    //   const query = new Query().equalTo('title', entity1.title);
    //   const entities = await store.find(query).toPromise();
    //   expect(entities).toEqual([entity1]);
    // });
  });

  describe('findById()', function() {
    const entityId = '57b48371319a67493dc50dba';
    const entity1 = {
      _id: entityId,
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

    beforeEach(function() {
      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}/${entityId}`)
        .reply(200, entity1, {
          'content-type': 'application/json',
          'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
          'x-kinvey-api-version': '4'
        });

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}/1`)
        .reply(404, {}, {
          'content-type': 'application/json',
          'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
          'x-kinvey-api-version': '4'
        });
    });

    afterEach(function() {

    });

    it('should throw a NotFoundError if the id argument does not exist', async function() {
      try {
        const store = new NetworkStore(collection);
        await store.findById("1").toPromise();
      } catch (error) {
        expect(error).toBeA(NotFoundError);
      }
    });

    it('should return the entity that matches the id argument', async function() {
      const store = new NetworkStore(collection);
      const entity = await store.findById(entityId).toPromise();
      expect(entity).toEqual(entity1);
    });
  });

  describe('count()', function() {

    beforeEach(function() {
      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}/_count`)
        .reply(200, {"count": 1}, {
          'content-type': 'application/json',
          'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
          'x-kinvey-api-version': '4'
        });
    });

    it('should return the count for the collection', async function(){
      const store = new NetworkStore(collection);
      const count = await store.count().toPromise();
      expect(count).toEqual(1);
    });
  });
  describe('group()', function() {
    it('return the count of all unique properties on the collection', async function() {
      // Kinvey API response
      const reply = [{ title: randomString(), count: 2 }, { title: randomString(), count: 1 }]
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/appdata/${this.client.appKey}/${collection}/_group`)
        .reply(200, reply , {
          'content-type': 'application/json'
        });

      const store = new NetworkStore(collection);
      const aggregation = Aggregation.count('title');
      return store.group(aggregation).toPromise()
        .then((result) => {
          expect(result).toBeA(Array);
          expect(result).toEqual(reply);
        })
    });
  });

  // describe('create()', function() {
  //   it('should create an entity in cache and add it to the sync table', async function() {
  //     // Create an entitiy
  //     const store = new NetworkStore(collection);
  //     const entity1 = {
  //       title: 'Opela',
  //       author: 'Maria Crawford',
  //       isbn: '887420007-2',
  //       summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
  //     };
  //     const result = await store.create(entity1);
  //     expect(result).toEqual(entity1);

  //     // Check the sync entities
  //     const query = new Query().equalTo('entityId', result._id);
  //     const syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'POST' },
  //       entityId: result._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });

  //     // Clear the store
  //     await store.clear();
  //   });

  //   it('should create an entity that contains an _id in cache and add it to the sync table', async function() {
  //     // Create an entitiy
  //     const store = new NetworkStore(collection);
  //     const entity1 = {
  //       _id: '57b48371319a67493dc50dba',
  //       title: 'Opela',
  //       author: 'Maria Crawford',
  //       isbn: '887420007-2',
  //       summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
  //     };
  //     const result = await store.create(entity1);
  //     expect(result).toEqual(entity1);

  //     // Check the sync entities
  //     const query = new Query().equalTo('entityId', result._id);
  //     const syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'POST' },
  //       entityId: result._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });

  //     // Clear the store
  //     await store.clear();
  //   });

  //   it('should create an array of entities in cache and add them to the sync table', async function() {
  //     // Create entities
  //     const store = new NetworkStore(collection);
  //     const entity1 = {
  //       title: 'Alphazap',
  //       author: 'Walter Nguyen',
  //       isbn: '750320687-X',
  //       summary: 'Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
  //     };
  //     const entity2 = {
  //       title: 'Treeflex',
  //       author: 'Harry Larson',
  //       isbn: '809087960-8',
  //       summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.'
  //     };
  //     const result = await store.create([entity1, entity2]);
  //     expect(result).toEqual([entity1, entity2]);

  //     // Check the sync entities
  //     let query = new Query().equalTo('entityId', result[0]._id);
  //     let syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'POST' },
  //       entityId: result[0]._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });

  //     // Check the sync entities
  //     query = new Query().equalTo('entityId', result[1]._id);
  //     syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'POST' },
  //       entityId: result[1]._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });

  //     // Clear the store
  //     await store.clear();
  //   });
  // });

  // describe('update()', function() {
  //   it('should update an entity in cache and add it to the sync table', async function() {
  //     // Update an entitiy
  //     const store = new NetworkStore(collection);
  //     const entity1 = {
  //       _id: '57b48371319a67493dc50dba',
  //       title: 'Opela',
  //       author: 'Maria Crawford',
  //       isbn: '887420007-2',
  //       summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
  //     };
  //     const result = await store.update(entity1);
  //     expect(result).toEqual(entity1);

  //     // Check the sync entities
  //     const query = new Query().equalTo('entityId', result._id);
  //     const syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'PUT' },
  //       entityId: result._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });

  //     // Clear the store
  //     await store.clear();
  //   });

  //   it('should update an entity that does not contain an _id in cache and add it to the sync table', async function() {
  //     // Update an entitiy
  //     const store = new NetworkStore(collection);
  //     const entity1 = {
  //       title: 'Opela',
  //       author: 'Maria Crawford',
  //       isbn: '887420007-2',
  //       summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
  //     };
  //     const result = await store.update(entity1);
  //     expect(result).toEqual(entity1);

  //     // Check the sync entities
  //     const query = new Query().equalTo('entityId', result._id);
  //     const syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'PUT' },
  //       entityId: result._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });

  //     // Clear the store
  //     await store.clear();
  //   });

  //   it('should update an array of entities in cache and add them to the sync table', async function() {
  //     // Update entities
  //     const store = new NetworkStore(collection);
  //     const entity1 = {
  //       title: 'Alphazap',
  //       author: 'Walter Nguyen',
  //       isbn: '750320687-X',
  //       summary: 'Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
  //     };
  //     const entity2 = {
  //       _id: '57b48371b262874d7e2f0a99',
  //       title: 'Treeflex',
  //       author: 'Harry Larson',
  //       isbn: '809087960-8',
  //       summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.'
  //     };
  //     const result = await store.update([entity1, entity2]);
  //     expect(result).toEqual([entity1, entity2]);

  //     // Check the sync entities
  //     let query = new Query().equalTo('entityId', result[0]._id);
  //     let syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'PUT' },
  //       entityId: result[0]._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });

  //     // Check the sync entities
  //     query = new Query().equalTo('entityId', result[1]._id);
  //     syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'PUT' },
  //       entityId: result[1]._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });

  //     // Clear the store
  //     await store.clear();
  //   });
  // });

  describe('save()', function() {
    const entity1 = {
      title: 'Opela',
      author: 'Maria Crawford',
      isbn: '887420007-2',
      summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
    };

    const entity2 = {
      _id: '57b48371319a67493dc50dba',
      title: 'Opela',
      author: 'Maria Crawford',
      isbn: '887420007-2',
      summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
    };

    const entity3 = {
      _id: '57b48371b262874d7e2f0a00',
      title: 'Alphazap',
      author: 'Walter Nguyen',
      isbn: '750320687-X',
      summary: 'Proin interdum mauris non ligula pellentesque ultrices. Phasellus id sapien in sapien iaculis congue. Vivamus metus arcu, adipiscing molestie, hendrerit at, vulputate vitae, nisl.',
    };

    const entity4 = {
      _id: '57b48371319a67493dc50dba',
      title: 'Treeflex',
      author: 'Harry Larson',
      isbn: '809087960-8',
      summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.'
    };

    beforeEach(function() {
      // Kinvey API response
      const store = new NetworkStore(collection)
      nock(store.client.baseUrl)
        .post(store.pathname, entity1)
        .query(true)
        .reply(200, entity2, {
          'content-type': 'application/json'
        });

      nock(store.client.baseUrl)
        .post(store.pathname, [entity3, entity4])
        .query(true)
        .reply(200, [entity3, entity4], {
          'content-type': 'application/json'
        });

    });

    afterEach(function () {
      expect.restoreSpies();
    });

    it('should call create() for an entity that does not contain an _id', async function() {
      const store = new NetworkStore(collection);
      const spy = expect.spyOn(store, 'create');

      // Save an entitiy
      await store.save(entity1);
      expect(spy).toHaveBeenCalled();
    });

    it('should call update() for an entity that contains an _id', async function() {
      const store = new NetworkStore(collection);
      const spy = expect.spyOn(store, 'update');

      // Save an entitiy
      await store.save(entity2);
      expect(spy).toHaveBeenCalled();

    });

    it('should call create() when an array of entities is provided', async function() {
      const store = new NetworkStore(collection);

      const spy = expect.spyOn(store, 'create');

      // Save the entities
      await store.save([entity3, entity4]);
      expect(spy).toHaveBeenCalled();

    });
  });

  // describe('remove()', function() {
  //   const entity1 = {
  //     _id: '57b48371319a67493dc50dba',
  //     title: 'Opela',
  //     author: 'Maria Crawford',
  //     isbn: '887420007-2',
  //     summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
  //     _acl: {
  //       creator: 'kid_HkTD2CJc'
  //     },
  //     _kmd: {
  //       lmt: '2016-08-17T15:32:01.741Z',
  //       ect: '2016-08-17T15:32:01.741Z'
  //     }
  //   };
  //   const entity2 = {
  //     _id: '57b48371b262874d7e2f0a99',
  //     title: 'Treeflex',
  //     author: 'Harry Larson',
  //     isbn: '809087960-8',
  //     summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
  //     _acl: {
  //       creator: 'kid_HkTD2CJc'
  //     },
  //     _kmd: {
  //       lmt: '2016-08-17T15:32:01.744Z',
  //       ect: '2016-08-17T15:32:01.744Z'
  //     }
  //   };

  //   beforeEach(function() {
  //     // Kinvey API response
  //     nock(this.client.apiHostname, { encodedQueryParams: true })
  //       .get(`/appdata/${this.client.appKey}/${collection}`)
  //       .reply(200, [entity1, entity2], {
  //         'content-type': 'application/json',
  //         'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
  //         'x-kinvey-api-version': '4'
  //       });

  //     // Pull data into cache
  //     const store = new NetworkStore(collection);
  //     return store.pull();
  //   });

  //   afterEach(async function() {
  //     // Clear the cache
  //     const store = new NetworkStore(collection);
  //     await store.clear();
  //   });

  //   it('should remove all entities from the cache', async function() {
  //     const store = new NetworkStore(collection);

  //     // Remove the entities
  //     let entities = await store.remove();
  //     expect(entities).toEqual([entity1, entity2]);

  //     // Check that the entities were removed
  //     entities = await store.find().toPromise();
  //     expect(entities).toEqual([]);
  //   });

  //   it('should remove only the entities from the cache that match the query', async function() {
  //     const store = new NetworkStore(collection);
  //     const query = new Query().equalTo('_id', entity1._id);

  //     // Remove the entity
  //     let entities = await store.remove(query);
  //     expect(entities).toEqual([entity1]);

  //     // Check that the entities were removed
  //     entities = await store.find().toPromise();
  //     expect(entities).toEqual([entity2]);
  //   });

  //   it('should remove an entity created offline from the sync table and cache', async function() {
  //     const store = new NetworkStore(collection);
  //     let entity3 = {
  //       title: 'Treeflex',
  //       author: 'Harry Larson',
  //       isbn: '809087960-8',
  //       summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
  //     };

  //     // Save the entity
  //     entity3 = await store.save(entity3);

  //     // Remove the entity
  //     const query = new Query().equalTo('_id', entity3._id);
  //     let entities = await store.remove(query);
  //     expect(entities).toEqual([entity3]);

  //     // Check that the entity was removed
  //     entities = await store.find().toPromise();
  //     expect(entities).toEqual([entity1, entity2]);
  //   });
  // });

  // describe('remove()', function() {
  //   const entity1 = {
  //     _id: '57b48371319a67493dc50dba',
  //     title: 'Opela',
  //     author: 'Maria Crawford',
  //     isbn: '887420007-2',
  //     summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
  //     _acl: {
  //       creator: 'kid_HkTD2CJc'
  //     },
  //     _kmd: {
  //       lmt: '2016-08-17T15:32:01.741Z',
  //       ect: '2016-08-17T15:32:01.741Z'
  //     }
  //   };
  //   const entity2 = {
  //     _id: '57b48371b262874d7e2f0a99',
  //     title: 'Treeflex',
  //     author: 'Harry Larson',
  //     isbn: '809087960-8',
  //     summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
  //     _acl: {
  //       creator: 'kid_HkTD2CJc'
  //     },
  //     _kmd: {
  //       lmt: '2016-08-17T15:32:01.744Z',
  //       ect: '2016-08-17T15:32:01.744Z'
  //     }
  //   };

  //   beforeEach(function() {
  //     // Kinvey API response
  //     nock(this.client.apiHostname, { encodedQueryParams: true })
  //       .get(`/appdata/${this.client.appKey}/${collection}`)
  //       .reply(200, [entity1, entity2], {
  //         'content-type': 'application/json',
  //         'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
  //         'x-kinvey-api-version': '4'
  //       });

  //     // Pull data into cache
  //     const store = new NetworkStore(collection);
  //     return store.pull();
  //   });

  //   afterEach(async function() {
  //     // Clear the cache
  //     const store = new NetworkStore(collection);
  //     await store.clear();
  //   });

  //   it('should remove all entities from the cache', async function() {
  //     const store = new NetworkStore(collection);

  //     // Remove the entities
  //     let entities = await store.remove();
  //     expect(entities).toEqual([entity1, entity2]);

  //     // Check that the entities were removed
  //     entities = await store.find().toPromise();
  //     expect(entities).toEqual([]);

  //     // Check the sync entities
  //     let query = new Query().equalTo('entityId', entity1._id);
  //     let syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'DELETE' },
  //       entityId: entity1._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });

  //     // Check the sync entities
  //     query = new Query().equalTo('entityId', entity2._id);
  //     syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'DELETE' },
  //       entityId: entity2._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });
  //   });

  //   it('should remove only the entities from the cache that match the query', async function() {
  //     const store = new NetworkStore(collection);
  //     let query = new Query().equalTo('_id', entity1._id);

  //     // Remove the entity
  //     let entities = await store.remove(query);
  //     expect(entities).toEqual([entity1]);

  //     // Check that the entities were removed
  //     entities = await store.find().toPromise();
  //     expect(entities).toEqual([entity2]);

  //     // Check the sync entities
  //     query = new Query().equalTo('entityId', entity1._id);
  //     const syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'DELETE' },
  //       entityId: entity1._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });
  //   });

  //   it('should remove an entity created offline from the sync table and cache', async function() {
  //     const store = new NetworkStore(collection);
  //     let entity3 = {
  //       title: 'Treeflex',
  //       author: 'Harry Larson',
  //       isbn: '809087960-8',
  //       summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
  //     };

  //     // Save the entity
  //     entity3 = await store.save(entity3);

  //     // Check the sync entities
  //     let query = new Query().equalTo('entityId', entity3._id);
  //     let syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'POST' },
  //       entityId: entity3._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });

  //     // Remove the entity
  //     query = new Query().equalTo('_id', entity3._id);
  //     let entities = await store.remove(query);
  //     expect(entities).toEqual([entity3]);

  //     // Check that the entity was removed
  //     entities = await store.find().toPromise();
  //     expect(entities).toEqual([entity1, entity2]);

  //     // Check the sync entities
  //     query = new Query().equalTo('entityId', entity3._id);
  //     syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities).toEqual([]);
  //   });
  // });

  // describe('removeById()', function() {
  //   const entity1 = {
  //     _id: '57b48371319a67493dc50dba',
  //     title: 'Opela',
  //     author: 'Maria Crawford',
  //     isbn: '887420007-2',
  //     summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
  //     _acl: {
  //       creator: 'kid_HkTD2CJc'
  //     },
  //     _kmd: {
  //       lmt: '2016-08-17T15:32:01.741Z',
  //       ect: '2016-08-17T15:32:01.741Z'
  //     }
  //   };
  //   const entity2 = {
  //     _id: '57b48371b262874d7e2f0a99',
  //     title: 'Treeflex',
  //     author: 'Harry Larson',
  //     isbn: '809087960-8',
  //     summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
  //     _acl: {
  //       creator: 'kid_HkTD2CJc'
  //     },
  //     _kmd: {
  //       lmt: '2016-08-17T15:32:01.744Z',
  //       ect: '2016-08-17T15:32:01.744Z'
  //     }
  //   };

  //   beforeEach(function() {
  //     // Kinvey API response
  //     nock(this.client.apiHostname, { encodedQueryParams: true })
  //       .get(`/appdata/${this.client.appKey}/${collection}`)
  //       .reply(200, [entity1, entity2], {
  //         'content-type': 'application/json',
  //         'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
  //         'x-kinvey-api-version': '4'
  //       });

  //     // Pull data into cache
  //     const store = new NetworkStore(collection);
  //     return store.pull();
  //   });

  //   afterEach(async function() {
  //     // Clear the cache
  //     const store = new NetworkStore(collection);
  //     await store.clear();
  //   });

  //   it('should throw a NotFoundError if the id argument is not a string', async function() {
  //     try {
  //       const store = new NetworkStore(collection);
  //       await store.removeById({});
  //     } catch (error) {
  //       expect(error).toBeA(NotFoundError);
  //     }
  //   });

  //   it('should throw a NotFoundError if the id argument does not exist', async function() {
  //     try {
  //       const store = new NetworkStore(collection);
  //       await store.removeById(randomString());
  //     } catch (error) {
  //       expect(error).toBeA(NotFoundError);
  //     }
  //   });

  //   it('should remove the entity that matches the id argument', async function() {
  //     const store = new NetworkStore(collection);

  //     // Remove the entity
  //     const result = await store.removeById(entity1._id);
  //     expect(result).toEqual(entity1);

  //     // Check that the entities were removed
  //     const entities = await store.find().toPromise();
  //     expect(entities).toEqual([entity2]);

  //     // Check the sync entities
  //     const query = new Query().equalTo('entityId', entity1._id);
  //     const syncEntities = await store.pendingSyncEntities(query);
  //     expect(syncEntities[0]).toEqual({
  //       collection: collection,
  //       state: { method: 'DELETE' },
  //       entityId: entity1._id,
  //       _id: syncEntities[0]._id,
  //       _kmd: { local: true }
  //     });
  //   });
  // });

});
