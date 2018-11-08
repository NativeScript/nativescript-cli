import { expect } from 'chai';
import nock from 'nock';
import { init } from './app';
import { register } from 'kinvey-http-node';
import { randomString } from 'kinvey-test-utils';
const defaultTimeout = process.env.KINVEY_DEFAULT_TIMEOUT || 60000;
const basicConfig = {
  appKey: randomString(),
  appSecret: randomString()
}

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

    it('should throw an error if instance id is not a string', () => {
      expect(() => {
        const instanceId = {};
        const client = init(Object.assign({ instanceId }, basicConfig));
        return client;
      }).to.throw(/Instance ID must be a string./);
    });

    it('should be able to provide an instance id', () => {
      const instanceId = randomString().toLowerCase();
      const client = init(Object.assign({ instanceId }, basicConfig));
      expect(client.apiHostname).to.equal(`https://${instanceId}-baas.kinvey.com`);
      expect(client.micHostname).to.equal(`https://${instanceId}-auth.kinvey.com`);
    });

    it('should be able to provide custom apiHostname with protocol https:', () => {
      const apiHostname = 'https://mybaas.kinvey.com';
      const client = init(Object.assign({ apiHostname: apiHostname }, basicConfig));
      expect(client.apiHostname).to.equal(apiHostname);
    });

    it('should be able to provide custom apiHostname with protocol http:', () => {
      const apiHostname = 'http://mybaas.kinvey.com';
      const client = init(Object.assign({ apiHostname: apiHostname }, basicConfig));
      expect(client.apiHostname).to.equal(apiHostname);
    });

    it('should be able to provide custom apiHostname without protocol', () => {
      const apiHostname = 'myauth.kinvey.com';
      const client = init(Object.assign({ apiHostname: apiHostname }, basicConfig));
      expect(client.apiHostname).to.equal(`https://${apiHostname}`);
    });

    it('should be able to provide custom micHostname with protocol https:', () => {
      const micHostname = 'https://myauth.kinvey.com';
      const client = init(Object.assign({ micHostname: micHostname }, basicConfig));
      expect(client.micHostname).to.equal(micHostname);
    });

    it('should be able to provide custom micHostname with protocol http:', () => {
      const micHostname = 'http://myauth.kinvey.com';
      const client = init(Object.assign({ micHostname: micHostname }, basicConfig));
      expect(client.micHostname).to.equal(micHostname);
    });

    it('should be able to provide custom micHostname without protocol', () => {
      const micHostname = 'myauth.kinvey.com';
      const client = init(Object.assign({ micHostname: micHostname }, basicConfig));
      expect(client.micHostname).to.equal(`https://${micHostname}`);
    });

    it('should be able to provide an appKey', () => {
      const extendableConfig = {
        appKey: randomString(),
        appSecret: randomString()
      }
      const appKey = randomString();
      const client = init(Object.assign(extendableConfig,{ appKey: appKey }));
      expect(client.appKey).to.equal(appKey);
    });

    it('should be able to provide an appSecret', () => {
      const extendableConfig = {
        appKey: randomString(),
        appSecret: randomString()
      }
      const appSecret = randomString();
      const client = init(Object.assign(extendableConfig,{ appSecret: appSecret }));
      expect(client.appSecret).to.equal(appSecret);
    });

    it('should be able to provide an masterSecret', () => {
      const masterSecret = randomString();
      const client = init({ masterSecret: masterSecret, appKey: randomString() });
      expect(client.masterSecret).to.equal(masterSecret);
    });

    it('should be able to provide an encryptionKey', () => {
      const encryptionKey = randomString();
      const client = init(Object.assign({ encryptionKey: encryptionKey }, basicConfig));
      expect(client.encryptionKey).to.equal(encryptionKey);
    });

    it('should be able to provide an appVersion', () => {
      const appVersion = randomString();
      const client = init(Object.assign({ appVersion: appVersion }, basicConfig));
      expect(client.appVersion).to.equal(appVersion);
    });

    it('should be able to provide a defaultTimeout', () => {
      const timeout = 1;
      const client = init(Object.assign({ defaultTimeout: timeout }, basicConfig));
      expect(client.defaultTimeout).to.equal(timeout);
    });

    describe('defaultTimeout', function() {
      it(`should set default timeout to ${defaultTimeout}ms`, function() {
        const client = init(basicConfig);
        expect(client.defaultTimeout).to.equal(defaultTimeout);
      });

      it(`should use ${defaultTimeout}ms when defaultTimeout is less than 0`, function() {
        const client = init(Object.assign(basicConfig,{ defaultTimeout: -1 }));
        expect(client.defaultTimeout).to.equal(defaultTimeout);
      });

      it(`should use ${defaultTimeout}ms when defaultTimeout is not a number`, function() {//TODO: when the value for defaultTimeout is wrong, we should use the DEFAULT_VALUE
        const client = init(Object.assign(basicConfig,{ defaultTimeout: 'foo' }));
        expect(client.defaultTimeout).to.equal(defaultTimeout);
      });

      it('should set the defaultTimeout to 1', function() {
        const timeout = 1;
        const client = init(Object.assign(basicConfig,{ defaultTimeout: timeout }));
        expect(client.defaultTimeout).to.equal(timeout);
      });
    });
  });
});
