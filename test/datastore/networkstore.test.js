import { NetworkStore, SyncStore } from 'src/datastore';
import Client from 'src/client';
import Query from 'src/query';
import Aggregation from 'src/aggregation';
import { KinveyError, NotFoundError, ServerError } from 'src/errors';
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

  describe('group()', function() {
    it('should throw an error for an invlad aggregation', function() {
      const store = new NetworkStore(collection);
      return store.group({}).toPromise()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid aggregation. It must be an instance of the Aggregation class.');
        })
    });

    it('should throw a ServerError', function() {
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/appdata/${this.client.appKey}/${collection}/_group`)
        .reply(500);

      const store = new NetworkStore(collection);
      const aggregation = Aggregation.count('title');
      return store.group(aggregation).toPromise()
        .catch((error) => {
          expect(error).toBeA(ServerError);
          expect(error.message).toEqual('An error occurred on the server.');
        })
    });

    it('should return the count of all unique properties on the collection', function() {
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

  describe('count()', function() {
    beforeEach(function() {
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}/_count`)
        .reply(200, {"count": 1}, {
          'content-type': 'application/json',
          'x-kinvey-request-id': 'a6b7712a0bca42b8a98c82de1fe0f5cf',
          'x-kinvey-api-version': '4'
        });
    });

    it('should throw an error for an invalid query', function() {
      const store = new NetworkStore(collection);
      return store.count({}).toPromise()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
        })
    });

    it('should throw a ServerError', function() {
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}/_count`)
        .reply(500);

      const store = new NetworkStore(collection);
      return store.count().toPromise()
        .catch((error) => {
          expect(error).toBeA(ServerError);
          expect(error.message).toEqual('An error occurred on the server.');
        })
    });

    it('should return the count for the collection', function(){
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}/_count`)
        .reply(200, { count: 1 });

      const store = new NetworkStore(collection);
      return store.count().toPromise()
        .then((count) => {
          expect(count).toEqual(1);
        });
    });
  });

  describe('create()', function() {
    it('should throw an error if trying to create an array of entities', async function() {
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
          expect(error.message).toEqual('Unable to create entities.');
        });
    });

    it('should create an entity', async function() {
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
      nock(this.client.apiHostname, { encodedQueryParams: true })
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

    it('should create an entity if it contains an _id', async function() {
      const store = new NetworkStore(collection);
      const entity = {
        _id: randomString(),
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };
      nock(this.client.apiHostname, { encodedQueryParams: true })
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

  describe('update()', function() {
    it('should throw an error if trying to update an array of entities', async function() {
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
          expect(error.message).toEqual('Unable to update entities.');
        });
    });

    it('should throw an error if an entity does not have an _id', async function() {
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

    it('should update an entity with an _id', async function() {
      const store = new NetworkStore(collection);
      const entity = {
        _id: randomString(),
        title: randomString(),
        author: randomString(),
        summary: randomString(),
      };
      nock(this.client.apiHostname, { encodedQueryParams: true })
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

  describe('save()', function() {
    afterEach(function () {
      expect.restoreSpies();
    });

    it('should call create() for an entity that does not contain an _id', function() {
      const store = new NetworkStore(collection);
      const spy = expect.spyOn(store, 'create');
      store.save({});
      expect(spy).toHaveBeenCalled();
    });

    it('should call update() for an entity that contains an _id', function() {
      const store = new NetworkStore(collection);
      const spy = expect.spyOn(store, 'update');
      store.save({ _id: randomString() });
      expect(spy).toHaveBeenCalled();
    });

    it('should call create() when an array of entities is provided', function() {
      const store = new NetworkStore(collection);
      const spy = expect.spyOn(store, 'create');
      store.save([{ _id: randomString() }, {}])
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('remove()', function() {
    it('should throw an error for an invalid query', function() {
      const store = new NetworkStore(collection);
      return store.remove({})
        .catch((error) => {
          expect(error).toBeA(KinveyError);
          expect(error.message).toEqual('Invalid query. It must be an instance of the Query class.');
        })
    });

    it('should throw a ServerError', function() {
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .delete(`/appdata/${this.client.appKey}/${collection}`)
        .reply(500);

      const store = new NetworkStore(collection);
      return store.remove()
        .catch((error) => {
          expect(error).toBeA(ServerError);
          expect(error.message).toEqual('An error occurred on the server.');
        })
    });

    it('should remove all entities from the cache', function() {
      const reply = { count: 2 };
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .delete(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, reply);

      const store = new NetworkStore(collection);
      return store.remove()
        .then((result) => {
          expect(result).toEqual(reply);
        });
    });
  });

  describe('removeById()', function() {
    it('should throw a NotFoundError if the id argument does not exist', function() {
      const store = new NetworkStore(collection);
      const _id = randomString();

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .delete(`/appdata/${this.client.appKey}/${collection}/${_id}`)
        .reply(404);

      return store.removeById(_id)
        .catch((error) => {
          expect(error).toBeA(NotFoundError);
        });
    });

    it('should remove the entity that matches the id argument', function() {
      const store = new NetworkStore(collection);
      const _id = randomString();
      const reply = { count: 1 };

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .delete(`/appdata/${this.client.appKey}/${collection}/${_id}`)
        .reply(200, reply);

      return store.removeById(_id)
        .then((response) => {
          expect(response).toEqual(reply);
        });
    });
  });
});
