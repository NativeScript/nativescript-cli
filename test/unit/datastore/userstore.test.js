import { UserStore as store } from 'src/datastore';
import Query from 'src/query';
import { KinveyError } from 'src/errors';
import { randomString } from 'src/utils';
import nock from 'nock';
import expect from 'expect';

describe('UserStore', function () {
  describe('find()', function() {
    describe('user discovery', function() {
      it('should throw an error if the query argument is not an instance of the Query class', function() {
        return store.find({}, { discover: true })
          .toPromise()
          .catch((error) => {
            expect(error).toBeA(KinveyError);
          });
      });

      it('should return an array of users', function() {
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
        nock(this.client.apiHostname, { encodedQueryParams: true })
          .post(`/user/${this.client.appKey}/_lookup`)
          .reply(200, USERS);

        return store.find(null, { discover: true })
          .toPromise()
          .then((users) => {
            expect(users).toEqual(USERS);
          });
      });

      it('should return an array of users matching the query', function() {
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
        nock(this.client.apiHostname, { encodedQueryParams: true })
          .post(`/user/${this.client.appKey}/_lookup`, query.toPlainObject().filter)
          .reply(200, USERS);

        return store.find(query, { discover: true })
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
});
