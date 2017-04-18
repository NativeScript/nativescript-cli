import { AuthType, DeltaFetchRequest, RequestMethod } from 'src/request';
import { KinveyError } from 'src/errors';
import { SyncStore } from 'src/datastore'
import { randomString } from 'src/utils';
import Query from 'src/query';
import nock from 'nock';
import expect from 'expect';
import url from 'url';
const collection = 'books';

describe('DeltaFetchRequest', function() {
  describe('method', function() {
    it('should not be able to be set to POST', function() {
      expect(() => {
        const request = new DeltaFetchRequest();
        request.method = RequestMethod.POST;
      }).toThrow(KinveyError, /Invalid request Method. Only RequestMethod.GET is allowed./);
    });

    it('should not be able to be set to PATCH', function() {
      expect(() => {
        const request = new DeltaFetchRequest();
        request.method = RequestMethod.PATCH;
      }).toThrow(KinveyError, /Invalid request Method. Only RequestMethod.GET is allowed./);
    });

    it('should not be able to be set to PUT', function() {
      expect(() => {
        const request = new DeltaFetchRequest();
        request.method = RequestMethod.PUT;
      }).toThrow(KinveyError, /Invalid request Method. Only RequestMethod.GET is allowed./);
    });

    it('should not be able to be set to DELETE', function() {
      expect(() => {
        const request = new DeltaFetchRequest();
        request.method = RequestMethod.DELETE;
      }).toThrow(KinveyError, /Invalid request Method. Only RequestMethod.GET is allowed./);
    });

    it('should be able to be set to GET', function() {
      const request = new DeltaFetchRequest();
      request.method = RequestMethod.GET;
      expect(request.method).toEqual(RequestMethod.GET);
    });
  });

  describe('execute()', function() {
    const entity1 = {
      _id: randomString(),
      _acl: {
        creator: randomString()
      },
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString()
      },
      title: 'entity1'
    };
    const entity2 = {
      _id: randomString(),
      _acl: {
        creator: randomString()
      },
      _kmd: {
        lmt: new Date().toISOString(),
        ect: new Date().toISOString()
      },
      title: 'entity2'
    };

    beforeEach(function() {
      // API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, [entity1, entity2], {
          'Content-Type': 'application/json'
        });

      // Pull data into cache
      const store = new SyncStore(collection);
      return store.pull()
        .then((entities) => {
          expect(entities).toEqual([entity1, entity2]);
        });
    });

    afterEach(function() {
      const store = new SyncStore(collection);
      return store.clear()
        .then(() => {
          return store.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should not fetch any entities from the network when delta set is empty', function() {
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `/appdata/${this.client.appKey}/${collection}`
        }),
        client: this.client
      });

      // API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .query({
          fields: '_id,_kmd.lmt'
        })
        .reply(200, [], {
          'Content-Type': 'application/json'
        });

      return request.execute()
        .then((response) => {
          const data = response.data;
          expect(data).toBeA(Array);
          expect(data).toEqual([]);
        });
    });

    it('should not fetch any entities from the network when delta set is equal to the cache', function() {
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `/appdata/${this.client.appKey}/${collection}`
        }),
        client: this.client
      });

      // API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .query({
          fields: '_id,_kmd.lmt'
        })
        .reply(200, [{
          _id: entity1._id,
          _kmd: entity1._kmd
        }, {
          _id: entity2._id,
          _kmd: entity2._kmd
        }], {
          'Content-Type': 'application/json'
        });

      return request.execute()
        .then((response) => {
          const data = response.data;
          expect(data).toBeA(Array);
          expect(data).toEqual([entity1, entity2]);
        });
    });

    it('should fetch only the updated entities from the network', function() {
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `/appdata/${this.client.appKey}/${collection}`
        }),
        client: this.client
      });

      // API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .query({
          fields: '_id,_kmd.lmt'
        })
        .reply(200, [{
          _id: entity1._id,
          _kmd: entity1._kmd
        }, {
          _id: entity2._id,
          _kmd: {
            lmt: new Date().toISOString(),
            ect: entity2._kmd.ect
          }
        }], {
          'Content-Type': 'application/json'
        });

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .query({
          query: `{"_id":{"$in":["${entity2._id}"]}}`
        })
        .reply(200, [entity2], {
          'Content-Type': 'application/json'
        });

      return request.execute()
        .then((response) => {
          const data = response.data;
          expect(data).toBeA(Array);
          expect(data).toEqual([entity2, entity1]);
        });
    });

    it('should fetch only the updated entities from the network matching the query', function() {
      const query = new Query();
      query.equalTo('_id', entity1._id);
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `/appdata/${this.client.appKey}/${collection}`
        }),
        query: query,
        client: this.client
      });

      // API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .query({
          fields: '_id,_kmd.lmt',
          query: `{"_id":"${entity1._id}"}`
        })
        .reply(200, [{
          _id: entity1._id,
          _kmd: {
            lmt: new Date().toISOString(),
            ect: entity1._kmd.ect
          }
        }], {
          'Content-Type': 'application/json'
        });

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .query({
          query: `{"_id":{"$in":["${entity1._id}"]}}`
        })
        .reply(200, [entity1], {
          'Content-Type': 'application/json'
        });

      return request.execute()
        .then((response) => {
          const data = response.data;
          expect(data).toBeA(Array);
          expect(data).toEqual([entity1]);
        });
    });

    it('should fetch the data from the network if there is not any data in the cache', function() {
      const store = new SyncStore(collection);
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: url.format({
          protocol: this.client.apiProtocol,
          host: this.client.apiHost,
          pathname: `/appdata/${this.client.appKey}/${collection}`
        }),
        client: this.client
      });

      // API response
      nock(this.client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${this.client.appKey}/${collection}`)
        .reply(200, [], {
          'Content-Type': 'application/json'
        });


      return store.clear()
        .then(() => {
          return request.execute();
        })
        .then((response) => {
          const data = response.data;
          expect(data).toBeA(Array);
          expect(data).toEqual([]);
        });
    });
  });
});
