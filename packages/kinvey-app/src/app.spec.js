import { expect } from 'chai';
import nock from 'nock';
import { init, ping } from './app';
import { randomString } from 'kinvey-test-utils';
import { register } from 'kinvey-http-node';

describe('App', () => {
  before(() => {
    register();
  });

  describe('init()', () => {
    it('should throw an error if an appKey is not provided', () => {
      expect(() => {
        init({
          appSecret: randomString()
        });
      }).to.throw();
    });

    it('should throw an error if an appSecret or masterSecret is not provided', () => {
      expect(() => {
        init({
          appKey: randomString()
        });
      }).to.throw();
    });

    it('should return the app config', () => {
      const appKey = randomString();
      const appSecret = randomString();
      const config = init({
        appKey: appKey,
        appSecret: appSecret
      });
      expect(config).to.have.own.property('appKey', appKey);
      expect(config).to.have.own.property('appSecret', appSecret);
    });

    it('should set default MIC host name when a custom one is not provided', () => {
      const config = init({
        appKey: randomString(),
        appSecret: randomString()
      });
      expect(config).to.include({ micHostname: 'https://auth.kinvey.com' });
    });

    it('should set a custom MIC host name when one is provided', () => {
      const micHostname = 'https://auth.example.com';
      const config = init({
        appKey: randomString(),
        appSecret: randomString(),
        micHostname: micHostname
      });
      expect(config).to.include({ micHostname: micHostname });
    });
  });

  describe('ping()', () => {
    it('should return a response', () => {
      const reply = {
        version: 1,
        kinvey: 'hello tests',
        appName: 'tests',
        environmentName: 'development'
      };
      const config = init({
        appKey: randomString(),
        appSecret: randomString(),
        apiHostname: "https://baas.kinvey.com"
      });

      nock(config.apiHostname)
        .get(`/appdata/${config.appKey}`)
        .reply(200, reply);

      return ping()
        .then((response) => {
          expect(response).to.deep.equal(reply);
        });
    });
  });
});
