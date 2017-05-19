import expect from 'expect';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import { LiveServiceManager } from 'src/live';
import { User } from 'src/entity';
import { UserMock } from 'test/mocks';
import { randomString, KinveyObservable } from 'src/utils';
import Client from 'src/client';

// Setup chai
chai.use(chaiAsPromised);
chai.should();

describe('LiveServiceManager', function() {
  describe('subscribe()', function() {
    it('should throw an error if a collection is not provided', function() {
      const promise = LiveServiceManager.subscribe();
      return promise.should.be.rejected;
    });

    it('should throw an error if collection is not a string', function() {
      const promise = LiveServiceManager.subscribe({});
      return promise.should.be.rejected;
    });

    it('should throw an error if there is no active user', function() {
      const promise = UserMock.logout()
        .then(() => {
          return LiveServiceManager.subscribe('books');
        });
      return promise.should.be.rejected;
    });

    it('should return a stream', function() {
      const activeUser = User.getActiveUser();
      const collection = randomString();
      const pubnubConfig = {
        subscribeKey: randomString(),
        publishKey: randomString(),
        userChannelGroup: randomString()
      };

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/user/${this.client.appKey}/${activeUser._id}/register-realtime`, { deviceId: this.client.deviceId })
        .reply(200, pubnubConfig);

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/appdata/${this.client.appKey}/${collection}/_subscribe`, { deviceId: this.client.deviceId })
        .reply(200);

      return LiveServiceManager.subscribe(collection, { client: this.client })
        .then((stream) => {
          expect(stream).toBeA(KinveyObservable);
        });
    });
  });

  describe('unsubscribe()', function() {
    it('should throw an error if a collection is not provided', function() {
      const promise = LiveServiceManager.subscribe();
      return promise.should.be.rejected;
    });

    it('should throw an error if collection is not a string', function() {
      const promise = LiveServiceManager.subscribe({});
      return promise.should.be.rejected;
    });

    it('should unsubscribe all listeners', function() {
      const activeUser = User.getActiveUser();
      const collection = randomString();
      const pubnubConfig = {
        subscribeKey: randomString(),
        publishKey: randomString(),
        userChannelGroup: randomString()
      };

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/user/${this.client.appKey}/${activeUser._id}/register-realtime`, { deviceId: this.client.deviceId })
        .times(2)
        .reply(200, pubnubConfig);

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/appdata/${this.client.appKey}/${collection}/_subscribe`, { deviceId: this.client.deviceId })
        .times(2)
        .reply(200);

      return LiveServiceManager.subscribe(collection, { client: this.client })
        .then(() => {
          return LiveServiceManager.subscribe(collection, { client: this.client });
        })
        .then(() => {
          nock(this.client.apiHostname)
            .post(`/appdata/${this.client.appKey}/${collection}/_unsubscribe`, { deviceId: this.client.deviceId })
            .times(2)
            .reply(200);

          return LiveServiceManager.unsubscribe(collection, { client: this.client });
        });
    });

    it('should keep subcriptions that fail to unsubscribe', function() {
      const activeUser = User.getActiveUser();
      const collection = randomString();
      const pubnubConfig = {
        subscribeKey: randomString(),
        publishKey: randomString(),
        userChannelGroup: randomString()
      };

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/user/${this.client.appKey}/${activeUser._id}/register-realtime`, { deviceId: this.client.deviceId })
        .times(2)
        .reply(200, pubnubConfig);

      nock(this.client.apiHostname, { encodedQueryParams: true })
        .post(`/appdata/${this.client.appKey}/${collection}/_subscribe`, { deviceId: this.client.deviceId })
        .times(2)
        .reply(200);

      const promise = LiveServiceManager.subscribe(collection, { client: this.client })
        .then(() => {
          return LiveServiceManager.subscribe(collection, { client: this.client });
        })
        .then(() => {
          nock(this.client.apiHostname, { encodedQueryParams: true })
            .post(`/appdata/${this.client.appKey}/${collection}/_unsubscribe`, { deviceId: this.client.deviceId })
            .reply(200);

          nock(this.client.apiHostname, { encodedQueryParams: true })
            .post(`/appdata/${this.client.appKey}/${collection}/_unsubscribe`, { deviceId: this.client.deviceId })
            .reply(500);

          return LiveServiceManager.unsubscribe(collection, { client: this.client });
        });
      return promise.should.be.rejected;
    });
  });
});
