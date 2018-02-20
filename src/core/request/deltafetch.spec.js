import nock from 'nock';
import expect from 'expect';
import { AuthType } from './network';
import { DeltaFetchRequest } from './deltafetch';
import { RequestMethod } from './request';
import { NetworkRack } from './rack';
import { KinveyError } from '../errors';
import { randomString } from '../utils';
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
    it('should send a regular GET request when a Delta Set request has never been performed', () => {
      const request = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
        client: client
      });

      // API response
      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [], {
          'X-Kinvey-Request-Start': new Date().toISOString()
        });

      return request.execute()
        .then((response) => {
          const { data } = response;
          expect(data).toBeA(Array);
          expect(data).toEqual([]);
        });
    });

    it('should create/update the entities in changed', () => {
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

      const firstRequest = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
        client: client
      });

      // API response
      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1], {
          'X-Kinvey-Request-Start': new Date().toISOString()
        });

      return firstRequest.execute()
        .then((response) => {
          const secondRequest = new DeltaFetchRequest({
            method: RequestMethod.GET,
            authType: AuthType.Default,
            url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
            client: client
          });

          // API response
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
            .query({ since: response.headers.get('X-Kinvey-Request-Start') })
            .reply(200, { changed: [entity2] }, {
              'X-Kinvey-Request-Start': new Date().toISOString()
            });

          return secondRequest.execute();
        })
        .then((response) => {
          const { data } = response;
          expect(data).toBeA(Array);
          expect(data).toEqual([entity1, entity2]);
        });
    });

    it('should remove the entities in deleted', () => {
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

      const firstRequest = new DeltaFetchRequest({
        method: RequestMethod.GET,
        authType: AuthType.Default,
        url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
        client: client
      });

      // API response
      nock(client.apiHostname)
        .get(`/appdata/${client.appKey}/${collection}`)
        .reply(200, [entity1], {
          'X-Kinvey-Request-Start': new Date().toISOString()
        });

      return firstRequest.execute()
        .then((response) => {
          const secondRequest = new DeltaFetchRequest({
            method: RequestMethod.GET,
            authType: AuthType.Default,
            url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
            client: client
          });

          // API response
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
            .query({ since: response.headers.get('X-Kinvey-Request-Start') })
            .reply(200, { changed: [entity2], deleted: [{ _id: entity1._id }] }, {
              'X-Kinvey-Request-Start': new Date().toISOString()
            });

          return secondRequest.execute();
        })
        .then((response) => {
          const { data } = response;
          expect(data).toBeA(Array);
          expect(data).toEqual([entity2]);
        });
    });
  });
});
