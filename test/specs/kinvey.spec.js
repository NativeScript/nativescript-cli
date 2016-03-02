import Kinvey from '../../src/kinvey';
import Client from '../../src/client';
import config from 'config';
import chai from 'chai';
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const appConfig = config.get('app');

describe('Kinvey', function () {
  describe('init()', function () {
    it('should respond', function () {
      expect(Kinvey).itself.to.respondTo('init');
    });

    it('should return a client', function() {
      expect(Kinvey.init({
        appKey: appConfig.key,
        appSecret: appConfig.secret
      })).to.be.an.instanceof(Client);
    });
  });

  describe('ping()', function() {
    before(function() {
      Kinvey.init({
        appKey: appConfig.key,
        appSecret: appConfig.secret
      });
    });

    it('should respond', function() {
      expect(Kinvey).itself.to.respondTo('ping');
    });

    it('should return a response when there is no active user', function() {
      return expect(Kinvey.ping()).to.eventually.deep.equal({
        version: appConfig.version,
        kinvey: `hello ${appConfig.name}`,
        appName: appConfig.name,
        environmentName: appConfig.environment
      });
    });
  });
});
