import { Kinvey } from '../src/kinvey';
import { Client } from '../src/client';
import { UserHelper } from './helper';
import { randomString } from '../src/utils/string';
import nock from 'nock';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

describe('Kinvey', function () {
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
  });

  describe('ping()', function() {
    after(function() {
      return UserHelper.logout();
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

      UserHelper.login();
      return Kinvey.ping().then(response => {
        expect(response).to.deep.equal(reply);
      });
    });
  });
});
