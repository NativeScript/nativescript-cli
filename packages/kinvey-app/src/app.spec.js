import { expect } from 'chai';
import nock from 'nock';
import { init, ping } from './app';
import { randomString } from 'kinvey-test-utils';
import { register } from 'kinvey-http-node';

const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

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

    it('should return a client', () => {//TODO: Obsolete?
      const appKey = randomString();
      const appSecret = randomString();
      const client = init({
        appKey: appKey,
        appSecret: appSecret
      });
      expect(client).to.be.instanceof(Client);
      expect(client).to.have.property(appKey);
      expect(client).to.have.property(appSecret);
      expect(client.appKey).to.equal(appKey);
      expect(client.appSecret).to.equal(appSecret);
    });

    it('should set default MIC host name when a custom one is not provided', () => {// TODO: SHould enable default hosts for init()
      const client = init({
        appKey: randomString(),
        appSecret: randomString()
      });
      expect(client).to.include({ micHostname: 'https://auth.kinvey.com' });
    });

    it('should set a custom MIC host name when one is provided', () => {
      const micHostname = 'https://auth.example.com';
      const client = init({
        appKey: randomString(),
        appSecret: randomString(),
        micHostname: micHostname
      });
      expect(client).to.include({ micHostname: micHostname });
    });
  });

  describe('ping()', () => {
    it('should return a response', () => {//TODO: Ping is not a function
      const reply = {
        version: 1,
        kinvey: 'hello tests',
        appName: 'tests',
        environmentName: 'development'
      };
      const client = init({
        appKey: randomString(),
        appSecret: randomString(),
        apiHostname: "https://baas.kinvey.com"
      });

      nock(client.apiHostname)
        .get(`/${appdataNamespace}/${client.appKey}`)
        .reply(200, reply);

      return ping()
        .then((response) => {
          expect(response).to.deep.equal(reply);
        });
    });
  });
});
