import { expect } from 'chai';
import nock from 'nock';
import { init, ping } from './kinvey';
import { randomString } from './utils';
import { Client } from './client';
import { NetworkRack } from './request';
import { NodeHttpMiddleware } from '../node/http';

const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';

describe('Kinvey', () => {
  before(() => {
    NetworkRack.useHttpMiddleware(new NodeHttpMiddleware({}));
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

    it('should return a client', () => {
      const appKey = randomString();
      const appSecret = randomString();
      const client = init({
        appKey: appKey,
        appSecret: appSecret
      });
      expect(client).to.be.an.instanceof(Client);
    });

    it('should set default MIC host name when a custom one is not provided', () => {
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
    it('should return a response', () => {
      const reply = {
        version: 1,
        kinvey: 'hello tests',
        appName: 'tests',
        environmentName: 'development'
      };
      const client = init({
        appKey: randomString(),
        appSecret: randomString()
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
