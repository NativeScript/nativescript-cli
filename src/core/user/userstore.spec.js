import nock from 'nock';
import expect from 'expect';
import { UserStore } from './userstore';
import { User } from './user';
import { Query } from '../query';
import { KinveyError } from '../errors';
import { randomString } from '../utils';
import { NetworkRack } from '../request';
import { NodeHttpMiddleware } from '../../node/http';
import { init } from '../kinvey';

describe('UserStore', () => {
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

  describe('lookup()', () => {
    it('should throw an error if the query argument is not an instance of the Query class', () => {
      const store = new UserStore();
      return store.lookup({})
        .toPromise()
        .catch((error) => {
          expect(error).toBeA(KinveyError);
        });
    });

    it('should return an array of users', () => {
      const store = new UserStore();
      const USERS = [{
        _id: randomString(),
        username: randomString(),
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        }
      }, {
        _id: randomString(),
        username: randomString(),
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        }
      }];

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/user/${client.appKey}/_lookup`)
        .reply(200, USERS);

      return store.lookup()
        .toPromise()
        .then((users) => {
          expect(users).toEqual(USERS);
        });
    });

    it('should return an array of users matching the query', () => {
      const store = new UserStore();
      const USERS = [{
        _id: randomString(),
        username: 'foo',
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        }
      }, {
        _id: randomString(),
        username: 'foo',
        _acl: {
          creator: randomString()
        },
        _kmd: {
          lmt: new Date().toISOString(),
          ect: new Date().toISOString()
        }
      }];
      const query = new Query();
      query.equalTo('username', 'foo');

      // Kinvey API response
      nock(client.apiHostname, { encodedQueryParams: true })
        .post(`/user/${client.appKey}/_lookup`, query.toPlainObject().filter)
        .reply(200, USERS);

      return store.lookup(query)
        .toPromise()
        .then((users) => {
          expect(users).toEqual(USERS);

          users.forEach(function(user) {
            expect(user.username).toEqual('foo');
          });
        });
    });
  });
});
