import Kinvey from './kinvey';
import Client from './client';
import { randomString } from './utils/string';
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
