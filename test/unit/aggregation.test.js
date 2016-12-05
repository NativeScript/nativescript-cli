import Aggregation from 'src/aggregation';
import { SyncStore } from 'src/datastore';
import { isDefined, randomString } from 'src/utils';
import nock from 'nock';
import expect from 'expect';
const collection = 'books';

describe('Aggregation', function() {
  describe('count()', function() {
    const commonName = 'Kinvey';

    beforeEach(function() {
      const entities = [];
      const store = new SyncStore(collection);

      function createEntity(title) {
        return {
          _id: randomString(),
          title: isDefined(title) ? title : randomString(),
          _acl: {
            creator: randomString()
          },
          _kmd: {
            lmt: new Date().toISOString(),
            ect: new Date().toISOString()
          }
        };
      }

      for (let i = 50; i >= 0; i -= 1) {
        if (i % 2 === 0) {
          entities.push(createEntity(commonName));
        } else {
          entities.push(createEntity());
        }
      }

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(store.pathname)
        .reply(200, entities, {
          'content-type': 'application/json'
        });

      // Pull data into cache
      return store.pull()
        .then((entities) => {
          expect(entities).toEqual(entities);
        });
    });

    afterEach(function() {
      // Clear the cache
      const store = new SyncStore(collection);
      return store.clear()
        .then(() => store.find(null, { syncAutomatically: false }).toPromise())
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });


    it('should return the count of a unique property value for all entities', function() {
      const store = new SyncStore(collection);
      return store.group(Aggregation.count('title')).toPromise()
        .then((results) => {
          expect(results).toBeA(Array);
          results.forEach((result) => {
            if (result.title === commonName) {
              expect(result.count).toEqual(26);
            } else {
              expect(result.count).toEqual(1);
            }
          });
        });
    });
  });

  describe('sum()', function() {
    let sum = 0;

    beforeEach(function() {
      const entities = [];
      const store = new SyncStore(collection);

      // Returns a random integer between min (included) and max (included)
      // Using Math.round() will give you a non-uniform distribution!
      function getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * ((max - min) + 1)) + min;
      }

      function createEntity() {
        const entity = {
          _id: randomString(),
          count: getRandomIntInclusive(1, 100),
          _acl: {
            creator: randomString()
          },
          _kmd: {
            lmt: new Date().toISOString(),
            ect: new Date().toISOString()
          }
        };
        sum += entity.count;
        return entity;
      }

      for (let i = 50; i >= 0; i -= 1) {
        entities.push(createEntity());
      }

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(store.pathname)
        .reply(200, entities, {
          'content-type': 'application/json'
        });

      // Pull data into cache
      return store.pull()
        .then((entities) => {
          expect(entities).toEqual(entities);
        });
    });

    afterEach(function() {
      // Clear the cache
      const store = new SyncStore(collection);
      return store.clear()
        .then(() => store.find(null, { syncAutomatically: false }).toPromise())
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });


    it('should return the sum of a property for all entities', function() {
      const store = new SyncStore(collection);
      return store.group(Aggregation.sum('count')).toPromise()
        .then((results) => {
          expect(results).toBeA(Array);
          expect(results[0].sum).toEqual(sum);
        });
    });
  });

  describe('min()', function() {
    let min = Infinity;

    beforeEach(function() {
      const entities = [];
      const store = new SyncStore(collection);

      // Returns a random integer between min (included) and max (included)
      // Using Math.round() will give you a non-uniform distribution!
      function getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * ((max - min) + 1)) + min;
      }

      function createEntity() {
        const entity = {
          _id: randomString(),
          count: getRandomIntInclusive(1, 100),
          _acl: {
            creator: randomString()
          },
          _kmd: {
            lmt: new Date().toISOString(),
            ect: new Date().toISOString()
          }
        };
        min = Math.min(min, entity.count);
        return entity;
      }

      for (let i = 50; i >= 0; i -= 1) {
        entities.push(createEntity());
      }

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(store.pathname)
        .reply(200, entities, {
          'content-type': 'application/json'
        });

      // Pull data into cache
      return store.pull()
        .then((entities) => {
          expect(entities).toEqual(entities);
        });
    });

    afterEach(function() {
      // Clear the cache
      const store = new SyncStore(collection);
      return store.clear()
        .then(() => store.find(null, { syncAutomatically: false }).toPromise())
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });


    it('should return the min value of a property for all entities', function() {
      const store = new SyncStore(collection);
      return store.group(Aggregation.min('count')).toPromise()
        .then((results) => {
          expect(results).toBeA(Array);
          expect(results[0].min).toEqual(min);
        });
    });
  });

  describe('max()', function() {
    let max = -Infinity;

    beforeEach(function() {
      const entities = [];
      const store = new SyncStore(collection);

      // Returns a random integer between min (included) and max (included)
      // Using Math.round() will give you a non-uniform distribution!
      function getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * ((max - min) + 1)) + min;
      }

      function createEntity() {
        const entity = {
          _id: randomString(),
          count: getRandomIntInclusive(1, 100),
          _acl: {
            creator: randomString()
          },
          _kmd: {
            lmt: new Date().toISOString(),
            ect: new Date().toISOString()
          }
        };
        max = Math.max(max, entity.count);
        return entity;
      }

      for (let i = 50; i >= 0; i -= 1) {
        entities.push(createEntity());
      }

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(store.pathname)
        .reply(200, entities, {
          'content-type': 'application/json'
        });

      // Pull data into cache
      return store.pull()
        .then((entities) => {
          expect(entities).toEqual(entities);
        });
    });

    afterEach(function() {
      // Clear the cache
      const store = new SyncStore(collection);
      return store.clear()
        .then(() => store.find(null, { syncAutomatically: false }).toPromise())
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });


    it('should return the max value of a property for all entities', function() {
      const store = new SyncStore(collection);
      return store.group(Aggregation.max('count')).toPromise()
        .then((results) => {
          expect(results).toBeA(Array);
          expect(results[0].max).toEqual(max);
        });
    });
  });

  describe('average()', function() {
    let average = 0;
    let count = 0;

    beforeEach(function() {
      const entities = [];
      const store = new SyncStore(collection);

      // Returns a random integer between min (included) and max (included)
      // Using Math.round() will give you a non-uniform distribution!
      function getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * ((max - min) + 1)) + min;
      }

      function createEntity() {
        const entity = {
          _id: randomString(),
          count: getRandomIntInclusive(1, 100),
          _acl: {
            creator: randomString()
          },
          _kmd: {
            lmt: new Date().toISOString(),
            ect: new Date().toISOString()
          }
        };
        average = ((average * count) + entity.count) / (count + 1);
        count += 1;
        return entity;
      }

      for (let i = 50; i >= 0; i -= 1) {
        entities.push(createEntity());
      }

      // Kinvey API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(store.pathname)
        .reply(200, entities, {
          'content-type': 'application/json'
        });

      // Pull data into cache
      return store.pull()
        .then((entities) => {
          expect(entities).toEqual(entities);
        });
    });

    afterEach(function() {
      // Clear the cache
      const store = new SyncStore(collection);
      return store.clear()
        .then(() => store.find(null, { syncAutomatically: false }).toPromise())
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });


    it('should return the count and average of a property for all entities', function() {
      const store = new SyncStore(collection);
      return store.group(Aggregation.average('count')).toPromise()
        .then((results) => {
          expect(results).toBeA(Array);
          expect(results[0].average).toEqual(average);
          expect(results[0].count).toEqual(count);
        });
    });
  });
});
