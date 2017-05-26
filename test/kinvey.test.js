import Kinvey from 'src/kinvey';
import { User } from 'src/entity';
import { randomString } from 'src/utils';
import { KinveyError } from 'src/errors';
import { UserMock } from 'test/mocks';
import expect from 'expect';
import nock from 'nock';
const appdataNamespace = process.env.KINVEY_DATASTORE_NAMESPACE || 'appdata';
const defaultMicProtocol = process.env.KINVEY_MIC_PROTOCOL || 'https:';
const defaultMicHost = process.env.KINVEY_MIC_HOST || 'auth.kinvey.com';

describe('Kinvey', function () {
  afterEach(function() {
    // Reintialize with the previous client
    return Kinvey.initialize({
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

  describe('initialize()', function () {
    it('should throw an error if an appKey is not provided', function() {
      Kinvey.initialize({
        appSecret: randomString()
      }).catch((error) => {
        expect(error).toBeA(KinveyError);
        return null;
      });
    });

    it('should throw an error if an appSecret or masterSecret is not provided', function() {
      return Kinvey.initialize({
        appKey: randomString()
      }).catch((error) => {
        expect(error).toBeA(KinveyError);
        return null;
      });
    });

    it('should return null', function() {
      return Kinvey.initialize({
        appKey: randomString(),
        appSecret: randomString()
      }).then((activeUser) => {
        expect(activeUser).toEqual(null);
      });
    });

    it('should return the active user', function() {
      const appKey = randomString();
      const appSecret = randomString();

      // Initialize Kinvey
      return Kinvey.initialize({
        appKey: appKey,
        appSecret: appSecret
      })
        .then(() => UserMock.login(randomString(), randomString())) // Login a user
        .then(() => {
          // Initialize Kinvey again
          return Kinvey.initialize({
            appKey: appKey,
            appSecret: appSecret
          });
        })
        .then((activeUser) => {
          expect(activeUser).toBeA(User);
          expect(activeUser._id).toEqual(UserMock.getActiveUser()._id);
        })
        .then(() => UserMock.logout()); // Logout
    });

    it('should set default MIC host name when a custom one is not provided', function() {
      return Kinvey.initialize({
        appKey: randomString(),
        appSecret: randomString()
      }).then(() => {
        const client = Kinvey.client;
        expect(client).toInclude({ micHostname: 'https://auth.kinvey.com' });
      });
    });

    it('should set a custom MIC host name when one is provided', function() {
      const micHostname = 'https://auth.example.com';
      return Kinvey.initialize({
        appKey: randomString(),
        appSecret: randomString(),
        micHostname: micHostname
      }).then(() => {
        const client = Kinvey.client;
        expect(client).toInclude({ micHostname: micHostname });
      });
    });

    it('should set additional modules after init', function() {
      // Initialize Kinvey
      return Kinvey.initialize({
        appKey: randomString(),
        appSecret: randomString()
      }).then(() => {
        // Expectations
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
