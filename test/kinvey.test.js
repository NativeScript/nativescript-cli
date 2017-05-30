import { Kinvey } from 'src/kinvey';
import { User } from 'src/entity';
import { randomString } from 'src/utils';
import { KinveyError } from 'src/errors';
import Client from 'src/client';
import { UserMock } from 'test/mocks';
import expect from 'expect';
import nock from 'nock';
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
        expect(() => {
            Kinvey.init({
                appSecret: randomString()
            });
        }).toThrow();
    });

    it('should throw an error if an appSecret or masterSecret is not provided', function() {
      expect(() => {
            Kinvey.init({
                appKey: randomString()
            });
        }).toThrow();
    });

    it('should return a client', function() {
      const appKey = randomString();
      const appSecret = randomString();

      // Initialize Kinvey
      const client = Kinvey.init({
        appKey: appKey,
        appSecret: appSecret
      });
      expect(client).toBeA(Client);
    });

    it('should set default MIC host name when a custom one is not provided', function() {
      const client = Kinvey.init({
        appKey: randomString(),
        appSecret: randomString()
      });
      expect(client).toInclude({ micHostname: 'https://auth.kinvey.com' });
    });

    it('should set a custom MIC host name when one is provided', function() {
      const micHostname = 'https://auth.example.com';
      const client = Kinvey.init({
        appKey: randomString(),
        appSecret: randomString(),
        micHostname: micHostname
      });
      expect(client).toInclude({ micHostname: micHostname });
    });

    it('should set additional modules after init', function() {
      // Initialize Kinvey
      Kinvey.init({
        appKey: randomString(),
        appSecret: randomString()
      });

      expect(Kinvey.Acl).toNotEqual(undefined);
      expect(Kinvey.Aggregation).toNotEqual(undefined);
      expect(Kinvey.AuthorizationGrant).toNotEqual(undefined);
      expect(Kinvey.CustomEndpoint).toNotEqual(undefined);
      expect(Kinvey.DataStore).toNotEqual(undefined);
      expect(Kinvey.DataStoreType).toNotEqual(undefined);
      expect(Kinvey.Files).toNotEqual(undefined);
      expect(Kinvey.Metadata).toNotEqual(undefined);
      expect(Kinvey.Query).toNotEqual(undefined);
      expect(Kinvey.User).toNotEqual(undefined);
    });
  });

  describe('ping()', function() {
    it('should return a response when there is no active user', function() {
      const reply = {
        version: 1,
        kinvey: 'hello tests',
        appName: 'tests',
        environmentName: 'development'
      };

      // Logout the active user
      return UserMock.logout()
        .then(() => {
          // Kinvey API Response
          nock(this.client.apiHostname)
            .get(`/${appdataNamespace}/${this.client.appKey}`)
            .query(true)
            .reply(200, reply, {
              'content-type': 'application/json'
            });

          // Ping Kinvey
          return Kinvey.ping();
        })
        .then((response) => {
          expect(response).toEqual(reply);
        });
    });

    it('should return a response when there is an active user', function() {
      const reply = {
        version: 1,
        kinvey: 'hello tests',
        appName: 'tests',
        environmentName: 'development'
      };

      // Kinvey API Response
      nock(this.client.apiHostname)
        .get(`/${appdataNamespace}/${this.client.appKey}`)
        .query(true)
        .reply(200, reply, {
          'content-type': 'application/json'
        });

      // Ping Kinvey
      return Kinvey.ping()
        .then((response) => {
          expect(response).toEqual(reply);
        });
    });
  });
});
