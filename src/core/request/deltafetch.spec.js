import nock from 'nock';
import expect from 'expect';
import { AuthType } from './network';
import { DeltaFetchRequest } from './deltafetch';
import { RequestMethod } from './request';
import { NetworkRack } from './rack';
import { KinveyError } from '../errors';
import { SyncStore } from '../datastore';
import { randomString } from '../utils';
import { Query } from '../query';
import { init } from '../kinvey';
import { User } from '../user';
import { NodeHttpMiddleware } from '../../node/http';

const collection = 'books';

describe('DeltaFetchRequest', () => {
  let client;

  before(() => {
    NetworkRack.useHttpMiddleware(new NodeHttpMiddleware({}));
  });

  before(() => {
    client = init({
      appKey: randomString(),
      appSecret: randomString()
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

    return User.login(username, password);
  });

  describe('method', () => {
    it('should not be able to be set to POST', () => {
      expect(() => {
        const request = new DeltaFetchRequest();
        request.method = RequestMethod.POST;
      }).toThrow(KinveyError, /Invalid request Method. Only RequestMethod.GET is allowed./);
    });

    it('should not be able to be set to PATCH', () => {
      expect(() => {
        const request = new DeltaFetchRequest();
        request.method = RequestMethod.PATCH;
      }).toThrow(KinveyError, /Invalid request Method. Only RequestMethod.GET is allowed./);
    });

    it('should not be able to be set to PUT', () => {
      expect(() => {
        const request = new DeltaFetchRequest();
        request.method = RequestMethod.PUT;
      }).toThrow(KinveyError, /Invalid request Method. Only RequestMethod.GET is allowed./);
    });

    it('should not be able to be set to DELETE', () => {
      expect(() => {
        const request = new DeltaFetchRequest();
        request.method = RequestMethod.DELETE;
      }).toThrow(KinveyError, /Invalid request Method. Only RequestMethod.GET is allowed./);
    });

    it('should be able to be set to GET', () => {
      const request = new DeltaFetchRequest();
      request.method = RequestMethod.GET;
      expect(request.method).toEqual(RequestMethod.GET);
    });
  });

  describe('execute()', () => {
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

    beforeEach(() => {
      // API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1, entity2], {
          'Content-Type': 'application/json'
        });

      // Pull data into cache
      const store = new SyncStore(collection);
      return store.pull()
        .then((entities) => {
          expect(entities).toEqual(2);
        });
    });

    afterEach(() => {
      const store = new SyncStore(collection);
      return store.clear()
        .then(() => {
          return store.find().toPromise();
        })
        .then((entities) => {
          expect(entities).toEqual([]);
        });
    });

    it('should not fetch any entities from the network when delta set is empty', () => {
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
        client: client
      });

      // API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${client.appKey}/${collection}`)
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

    it('should not fetch any entities from the network when delta set is equal to the cache', () => {
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
        client: client
      });

      // API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${client.appKey}/${collection}`)
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

    it('should fetch only the updated entities from the network', () => {
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
        client: client
      });

      // API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${client.appKey}/${collection}`)
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

      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${client.appKey}/${collection}`)
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

    it('should fetch only the updated entities from the network matching the query', () => {
      const query = new Query();
      query.equalTo('_id', entity1._id);
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
        query: query,
        client: client
      });

      // API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${client.appKey}/${collection}`)
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

      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${client.appKey}/${collection}`)
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

    it('should fetch the data from the network if there is not any data in the cache', () => {
      const store = new SyncStore(collection);
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
        client: client
      });

      // API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .get(`/appdata/${client.appKey}/${collection}`)
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
