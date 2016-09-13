import { User } from '../../../../src/entity';
import { Client } from '../../../../src/client';
import { randomString } from '../../../../src/utils';
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

    // Setup nock response
    nock(this.client.apiHostname, { encodedQueryParams: true })
      .post(`${this.pathname}/login`, { username: username, password: password })
      .reply(200, reply, {
        'content-type': 'application/json; charset=utf-8'
      });

    // Login
    return super.login(username, password, options);
  }

  logout(options) {
    // Setup nock response
    nock(this.client.apiHostname, { encodedQueryParams: true })
      .post('/user/kid_HkTD2CJc/_logout')
      .reply(204, '', {});

    // Logout
    return super.logout(options);
  }
}
