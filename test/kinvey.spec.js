import './setup';
import Kinvey from '../src/kinvey';
import Client from '../src/client';
import { loginUser, logoutUser } from './utils/user';
import { randomString } from '../src/utils/string';
import nock from 'nock';
import chai from 'chai';
const expect = chai.expect;
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

describe('Kinvey', function () {
  afterEach(function() {
    // Reintialize with the previous client
    Kinvey.init({
      appKey: this.client.appKey,
      appSecret: this.client.appSecret
    });
  });

  describe('appVersion', function() {
    it('should set the appVersion', function() {
      const appVersion = '1.0.0';
      Kinvey.appVersion = appVersion;
      expect(Kinvey.appVersion).to.equal(appVersion);
    });
  });

  describe('init()', function () {
    it('should respond', function () {
      expect(Kinvey).itself.to.respondTo('init');
    });

    it('should return a client', function() {
      expect(Kinvey.init({
        appKey: randomString(),
        appSecret: randomString()
      })).to.be.an.instanceof(Client);
    });

    it('should set additional modules after init', function() {
      Kinvey.init({
        appKey: randomString(),
        appSecret: randomString()
      });
      expect(Kinvey).to.have.property('Aggregation');
      expect(Kinvey).to.have.property('AuthorizationGrant');
      expect(Kinvey).to.have.property('CustomEndpoint');
      expect(Kinvey).to.have.property('DataStore');
      expect(Kinvey).to.have.property('DataStoreType');
      expect(Kinvey).to.have.property('FileStore');
      expect(Kinvey).to.have.property('Log');
      expect(Kinvey).to.have.property('Metadata');
      expect(Kinvey).to.have.property('Query');
      expect(Kinvey).to.have.property('SocialIdentity');
      expect(Kinvey).to.have.property('Sync');
      expect(Kinvey).to.have.property('User');
      expect(Kinvey).to.have.property('UserStore');
    });
  });

  describe('ping()', function() {
    after(function() {
      return logoutUser.call(this);
    });

    it('should respond', function() {
      expect(Kinvey).itself.to.respondTo('ping');
    });

    it('should return a response when there is no active user', function() {
      const reply = {
        version: 1,
        kinvey: 'hello tests',
        appName: 'tests',
        environmentName: 'development'
      };
      nock(this.client.baseUrl)
        .get(`/${appdataNamespace}/${this.client.appKey}`)
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      return Kinvey.ping().then(response => {
        expect(response).to.deep.equal(reply);
      });
    });

    it('should return a response when there is an active user', function() {
      const reply = {
        version: 1,
        kinvey: 'hello tests',
        appName: 'tests',
        environmentName: 'development'
      };
      nock(this.client.baseUrl)
        .get(`/${appdataNamespace}/${this.client.appKey}`)
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      return loginUser.call(this).then(() => Kinvey.ping()).then(response => {
        expect(response).to.deep.equal(reply);
      });
    });
  });
});
