import { Kinvey } from './kinvey';
import { Client } from './client';
import { UserHelper } from './utils/spec';
import { randomString } from './utils/string';
import fetchMock from 'fetch-mock';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

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
      fetchMock.mock('^https://baas.kinvey.com', 'GET', {
        headers: {
          'Content-Type': 'application/json'
        },
        body: reply
      });

      return Kinvey.ping().then(response => {
        expect(response).to.deep.equal(reply);
        fetchMock.restore();
      });
    });

    it('should return a response when there is an active user', function() {
      const reply = {
        version: 1,
        kinvey: 'hello tests',
        appName: 'tests',
        environmentName: 'development'
      };
      fetchMock.mock('^https://baas.kinvey.com', 'GET', {
        headers: {
          'Content-Type': 'application/json'
        },
        body: reply
      });

      return UserHelper.login().then(() => {
        return Kinvey.ping();
      }).then(response => {
        expect(response).to.deep.equal(reply);
        fetchMock.restore();
      });
    });
  });
});
