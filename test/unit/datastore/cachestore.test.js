import { CacheStore, SyncStore } from 'src/datastore';
import Client from 'src/client';
import Query from 'src/query';
import { KinveyError, NotFoundError } from 'src/errors';
import { randomString } from 'src/utils';
import nock from 'nock';
import expect from 'expect';
const collection = 'Books';

describe('CacheStore', function() {
  describe('clear()', function() {
    const entity1 = {
      _id: randomString(),
      title: 'Opela',
      author: 'Maria Crawford',
      isbn: '887420007-2',
      summary: 'Quisque id justo sit amet sapien dignissim vestibulum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla dapibus dolor vel est. Donec odio justo, sollicitudin ut, suscipit a, feugiat et, eros.\n\nVestibulum ac est lacinia nisi venenatis tristique. Fusce congue, diam id ornare imperdiet, sapien urna pretium nisl, ut volutpat sapien arcu sed augue. Aliquam erat volutpat.',
      _acl: {
        creator: randomString()
      },
      _kmd: {
        lmt: '2016-08-17T15:32:01.741Z',
        ect: '2016-08-17T15:32:01.741Z'
      }
    };
    const entity2 = {
      _id: randomString(),
      title: 'Treeflex',
      author: 'Harry Larson',
      isbn: '809087960-8',
      summary: 'Aenean fermentum. Donec ut mauris eget massa tempor convallis. Nulla neque libero, convallis eget, eleifend luctus, ultricies eu, nibh.',
      _acl: {
        creator: randomString()
      },
      _kmd: {
        lmt: '2016-08-17T15:32:01.744Z',
        ect: '2016-08-17T15:32:01.744Z'
      }
    };

    beforeEach(async function() {
      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2], {
          'content-type': 'application/json'
        });

      // Pull data into cache
      const store = new CacheStore(collection);
      const entities = await store.pull();
      expect(entities).toEqual([entity1, entity2]);
    });

    afterEach(async function() {
      // Clear the cache
      const store = new CacheStore(collection);
      await store.clear();
      const entities = await store.find(null, { syncAutomatically: false }).toPromise();
      expect(entities).toEqual([]);
    });

    it('should remove all entities from the cache', async function() {
      const store = new CacheStore(collection);

      // Remove the entities
      let entities = await store.clear();
      expect(entities).toEqual([entity1, entity2]);

      // Check that the entities were removed
      const syncStore = new SyncStore(collection);
      entities = await syncStore.find().toPromise();
      expect(entities).toEqual([]);

      // Check the sync entities
      const syncEntities = await store.pendingSyncEntities();
      expect(syncEntities).toEqual([]);
    });

    it('should remove only the entities from the cache that match the query', async function() {
      const store = new CacheStore(collection);

      // Remove the entities
      const query = new Query().equalTo('_id', entity1._id);
      let entities = await store.clear(query);
      expect(entities).toEqual([entity1]);

      // Check that the entities that matched the query were removed
      const syncStore = new SyncStore(collection);
      entities = await syncStore.find().toPromise();
      expect(entities).toEqual([entity2]);

      // Check the sync entities
      const syncEntities = await store.pendingSyncEntities();
      expect(syncEntities).toEqual([]);
    });
  });
});
