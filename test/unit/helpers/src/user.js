import { User } from '../../../../src/entity';
import { Client } from '../../../../src/client';
import nock from 'nock';

export class TestUser extends User {
  static getActiveUser(client = Client.sharedInstance()) {
    const data = client.activeUser;
    let user = null;

    if (data) {
      user = new User(data);
      user.client = client;
    }

    return user;
  }

  login(username, password, options) {
    // Setup nock response
    nock(this.client.apiHostname, { encodedQueryParams: true })
      .post('/user/kid_HkTD2CJc/login', { username: username, password: password })
      .reply(200, {
        _id: '57b265b6b10771153261b833',
        username: username,
        _kmd: {
          lmt: '2016-08-16T01:00:38.599Z',
          ect: '2016-08-16T01:00:38.599Z',
          authtoken: '95df42b0-73d3-496d-a4ac-5d81a6e5aacd.XwHgpqCcCOplSbCNPO1KToO0rl125BmCR4caiWgrgEc='
        },
        _acl: {
          creator: '57b265b6b10771153261b833'
        }
      }, {
        'content-type': 'application/json; charset=utf-8',
        'content-length': '269',
        'x-kinvey-request-id': 'f0ca525588fc4a059e8bf9c3861dcb2a',
        'x-kinvey-api-version': '4'
      });

    // Login
    return super.login(username, password, options);
  }

  logout(options) {
    // Setup nock response
    nock(this.client.apiHostname, { encodedQueryParams: true })
      .post('/user/kid_HkTD2CJc/_logout')
      .reply(204, '', {
        'x-kinvey-request-id': 'e0cb127bbed940f6884aa5ea56f10d0b',
        'x-kinvey-api-version': '4'
      });

    // Logout
    return super.logout(options);
  }
}
