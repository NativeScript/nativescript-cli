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
import { repositoryProvider } from '../datastore/repositories/repository-provider';

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

  afterEach(() => {
    return repositoryProvider.getOfflineRepository()
      .then((repo) => repo.clear());
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
    it('should send a regular GET request when a delta set request has never been performed', () => {
      const entity1 = { _id: randomString() };

      const request = new DeltaFetchRequest({
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

      return request.execute()
        .then((response) => {
          const { changed, deleted } = response.data;
          expect(changed).toBeA(Array);
          expect(changed).toEqual([entity1]);
          expect(deleted).toBeA(Array);
          expect(deleted).toEqual([]);
        });
    });

    it('should send a delta set request', () => {
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
          const { changed, deleted } = response.data;
          expect(changed).toBeA(Array);
          expect(changed).toEqual([entity2]);
          expect(deleted).toBeA(Array);
          expect(deleted).toEqual([{ _id: entity1._id }]);
        });
    });

    it('should send a delta set request with the correct since query parameter value', () => {
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
      const requestStartDate1 = new Date();
      const requestStartDate2 = new Date();
      requestStartDate2.setSeconds(requestStartDate1.getSeconds() + 10);
      const requestStartDate3 = new Date();
      requestStartDate3.setSeconds(requestStartDate2.getSeconds() + 10);

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
          'X-Kinvey-Request-Start': requestStartDate1.toISOString()
        });

      return firstRequest.execute()
        .then(() => {
          const secondRequest = new DeltaFetchRequest({
            method: RequestMethod.GET,
            authType: AuthType.Default,
            url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
            client: client
          });

          // API response
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
            .query({ since: requestStartDate1.toISOString() })
            .reply(200, { changed: [entity2] }, {
              'X-Kinvey-Request-Start': requestStartDate2.toISOString()
            });

          return secondRequest.execute();
        })
        .then(() => {
          const thirdRequest = new DeltaFetchRequest({
            method: RequestMethod.GET,
            authType: AuthType.Default,
            url: `${client.apiHostname}/appdata/${client.appKey}/${collection}`,
            client: client
          });

          // API response
          nock(client.apiHostname)
            .get(`/appdata/${client.appKey}/${collection}/_deltaset`)
            .query({ since: requestStartDate2.toISOString() })
            .reply(200, { changed: [entity2] }, {
              'X-Kinvey-Request-Start': requestStartDate3.toISOString()
            });

          return thirdRequest.execute();
        })
        .then((response) => {
          const { changed, deleted } = response.data;
          expect(changed).toBeA(Array);
          expect(changed).toEqual([entity2]);
          expect(deleted).toBeA(Array);
          expect(deleted).toEqual([]);
        });
    });
  });
});
