import Kinvey from 'kinvey-sdk-core/kinvey';
import Client from 'kinvey-sdk-core/client';
import { randomString } from 'test/helpers';
import chai from 'chai';
chai.use(require('chai-as-promised'));
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
    before(function() {
      Kinvey.init({
        appKey: randomString(),
        appSecret: randomString()
      });
    });

    it('should respond', function() {
      expect(Kinvey).itself.to.respondTo('ping');
    });

    // it('should return a response when there is no active user', function() {
    //   return expect(Kinvey.ping()).to.eventually.deep.equal({
    //     version: appConfig.version,
    //     kinvey: `hello ${appConfig.name}`,
    //     appName: appConfig.name,
    //     environmentName: appConfig.environment
    //   });
    // });
  });
});
