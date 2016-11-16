import { TestUser } from './mocks';
import Kinvey from '../../src/kinvey';
import { Client } from '../../src/client';
import { randomString } from '../../src/utils';
import expect from 'expect';
import nock from 'nock';
import regeneratorRuntime from 'regenerator-runtime'; // eslint-disable-line no-unused-vars
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const defaultMicProtocol = process.env.KINVEY_MIC_PROTOCOL || 'https:';
const defaultMicHost = process.env.KINVEY_MIC_HOST || 'auth.kinvey.com';

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
      expect(Kinvey.appVersion).toEqual(appVersion);
    });
  });

  describe('init()', function () {
    it('should throw an error if an appKey is not provided', function() {
      expect(function() {
        Kinvey.init({
          appSecret: randomString()
        });
      }).toThrow();
    });

    it('should throw an error if an appSecret or masterSecret is not provided', function() {
      expect(function() {
        Kinvey.init({
          appKey: randomString()
        });
      }).toThrow();
    });

    it('should return a client', function() {
      expect(Kinvey.init({
        appKey: randomString(),
        appSecret: randomString()
      })).toBeA(Client);
    });

    it('should set default MIC host name when a custom one is not provided', function() {
      const client = Kinvey.init({
        appKey: randomString(),
        appSecret: randomString()
      });
      expect(client).toInclude({ micProtocol: defaultMicProtocol });
      expect(client).toInclude({ micHost: defaultMicHost });
    });

    it('should set a custom MIC host name when one is provided', function() {
      const micHostname = 'https://auth.example.com';
      const client = Kinvey.init({
        appKey: randomString(),
        appSecret: randomString(),
        micHostname: micHostname
      });
      expect(client).toInclude({ micProtocol: 'https:' });
      expect(client).toInclude({ micHost: 'auth.example.com' });
    });

    it('should set additional modules after init', function() {
      // Initialize Kinvey
      Kinvey.init({
        appKey: randomString(),
        appSecret: randomString()
      });

      // Expectations
      expect(Kinvey.Acl).toNotEqual(undefined);
      expect(Kinvey.Aggregation).toNotEqual(undefined);
      expect(Kinvey.AuthorizationGrant).toNotEqual(undefined);
      expect(Kinvey.CustomEndpoint).toNotEqual(undefined);
      expect(Kinvey.DataStore).toNotEqual(undefined);
      expect(Kinvey.DataStoreType).toNotEqual(undefined);
      expect(Kinvey.Files).toNotEqual(undefined);
      expect(Kinvey.Log).toNotEqual(undefined);
      expect(Kinvey.Metadata).toNotEqual(undefined);
      expect(Kinvey.Query).toNotEqual(undefined);
      expect(Kinvey.SocialIdentity).toNotEqual(undefined);
      expect(Kinvey.User).toNotEqual(undefined);
      expect(Kinvey.Users).toNotEqual(undefined);
      expect(Kinvey.UserStore).toNotEqual(undefined);
    });
  });

  describe('ping()', function() {
    it('should return a response when there is no active user', async function() {
      const reply = {
        version: 1,
        kinvey: 'hello tests',
        appName: 'tests',
        environmentName: 'development'
      };

      // Logout the active user
      await TestUser.logout();

      // Kinvey API Response
      nock(this.client.baseUrl)
        .get(`/${appdataNamespace}/${this.client.appKey}`)
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      // Ping Kinvey
      const response = await Kinvey.ping();

      // Expectations
      expect(response).toEqual(reply);
    });

    it('should return a response when there is an active user', async function() {
      const reply = {
        version: 1,
        kinvey: 'hello tests',
        appName: 'tests',
        environmentName: 'development'
      };

      // Kinvey API Response
      nock(this.client.baseUrl)
        .get(`/${appdataNamespace}/${this.client.appKey}`)
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      // Ping Kinvey
      const response = await Kinvey.ping();

      // Expectations
      expect(response).toEqual(reply);
    });
  });
});
