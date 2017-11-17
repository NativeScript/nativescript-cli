const { UserStore } = require('../src/userstore');
const { User } = require('../src/user');
const { Query } = require('kinvey-query');
const { KinveyError } = require('kinvey-errors');
const { randomString } = require('kinvey-utils/string');
const { NetworkRack } = require('kinvey-request');
const { init } = require('kinvey');
const { HttpMiddleware } = require('./http');
const nock = require('nock');
const expect = require('expect');

describe('UserStore', () => {
  let client;

  before(() => {
    NetworkRack.useHttpMiddleware(new HttpMiddleware());
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
