import { Kinvey } from '../src/kinvey';
import { KinveyRackManager } from '../src/rack/rack';
import { HttpMiddleware } from '../src/rack/http';
import { TestHttpMiddleware } from './mocks/http';
import { User } from '../src/user';
import { Promise } from 'es6-promise';
import { randomString } from '../src/utils/string';
import sinon from 'sinon';
import nock from 'nock';
import bind from 'lodash/bind';

// Swap Http middleware
KinveyRackManager.networkRack.swap(HttpMiddleware, new TestHttpMiddleware());

// Initialize the SDK
const client = Kinvey.init({
  appKey: randomString(),
  appSecret: randomString(),
  appVersion: randomString()
});

// Login
function login() {
  const user = new User();
  user.client = this.client;
  nock(this.client.baseUrl)
    .post(`${user.pathname}/login`, () => true)
    .query(true)
    .reply(200, {
      _id: randomString(),
      _kmd: {
        authtoken: randomString()
      }
    }, {
      'content-type': 'application/json'
    });
  return user.login('test', 'test');
}

// Logout
function logout() {
  const user = User.getActiveUser(this.client);

  if (user) {
    nock(this.client.baseUrl)
      .post(`${user.pathname}/_logout`, () => true)
      .query(true)
      .reply(204, null, {
        'content-type': 'application/json'
      });
    return user.logout();
  }

  return Promise.resolve();
}

before(function() {
  this.client = client;
  this.login = bind(login, this);
  this.logout = bind(logout, this);
});

after(function() {
  delete this.client;
});

afterEach(function() {
  nock.cleanAll();
});

beforeEach(function() {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  this.sandbox.restore();
  delete this.sandbox;
});
