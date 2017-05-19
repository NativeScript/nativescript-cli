import expect from 'expect';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import isFunction from 'lodash/isFunction';
import Proxyquire from 'proxyquire';
import EventEmitter from 'events';
import { User } from 'src/entity';
import { randomString, KinveyObservable } from 'src/utils';

// Setup chai
chai.use(chaiAsPromised);
chai.should();

// Create PubNubMock
class PubNubMock extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.listeners = [];
    this.removedListeners = [];
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    const index = this.listeners.indexOf(listener);

    if (index !== -1) {
      this.removedListeners = this.removedListeners.concat(this.listeners.splice(index, 1));
    }
  }

  subscribe({ channelGroups }) {
    channelGroups.forEach((channelGroup) => {
      this.listeners.forEach((listener) => {
        this.on(`${channelGroup}:status`, (event) => {
          if (isFunction(listener.status)) {
            listener.status(event);
          }
        });

        this.on(`${channelGroup}:message`, (event) => {
          if (isFunction(listener.message)) {
            listener.message(event);
          }
        });

        this.on(`${channelGroup}:presence`, (event) => {
          if (isFunction(listener.presence)) {
            listener.presence(event);
          }
        });
      });
    });
  }

  unsubscribe({ channelGroups }) {
    channelGroups.forEach((channelGroup) => {
      this.removeAllListeners(`${channelGroup}:status`);
      this.removeAllListeners(`${channelGroup}:message`);
      this.removeAllListeners(`${channelGroup}:presence`);
    });
  }
}

// Use proxyquire to stub PubNub
// https://github.com/thlorenz/proxyquire
const proxyquire = Proxyquire.noCallThru();
const LiveServiceSubscription = proxyquire('../../src/live/src/subscription', { pubnub: PubNubMock }).default;

// Tests
describe('LiveServiceSubscription', function() {
  describe('constructor', function() {
    it('should throw an error if a collection is not provided', function() {
      expect(() => {
        const subscription = new LiveServiceSubscription();
        return subscription;
      }).toThrow();
    });

    it('should throw an error if collection is not a string', function() {
      expect(() => {
        const subscription = new LiveServiceSubscription({});
        return subscription;
      }).toThrow();
    });
  });

  describe('subscribe()', function() {
    it('should return a stream', function() {
      const activeUser = User.getActiveUser();
      const collection = randomString();
      const pubnubConfig = {
        subscribeKey: randomString(),
        publishKey: randomString(),
        authKey: activeUser.authtoken,
        userChannelGroup: randomString()
      };
      const subscription = new LiveServiceSubscription(collection, pubnubConfig);

      nock(subscription.client.apiHostname)
        .post(`/appdata/${subscription.client.appKey}/${subscription.collection}/_subscribe`, { deviceId: subscription.client.deviceId })
        .reply(200);

      return subscription.subscribe()
        .then((stream) => {
          expect(stream).toBeA(KinveyObservable);
        });
    });

    it('should call onNext callback when a message event is received', function(done) {
      const activeUser = User.getActiveUser();
      const collection = randomString();
      const pubnubConfig = {
        subscribeKey: randomString(),
        publishKey: randomString(),
        authKey: activeUser.authtoken,
        userChannelGroup: randomString()
      };
      const subscription = new LiveServiceSubscription(collection, pubnubConfig);

      nock(subscription.client.apiHostname)
        .post(`/appdata/${subscription.client.appKey}/${subscription.collection}/_subscribe`, { deviceId: subscription.client.deviceId })
        .reply(200);

      subscription.subscribe(pubnubConfig.userChannelGroup)
        .then((stream) => {
          const event = { message: { _id: randomString() } };
          const spy = expect.createSpy(() => {
            try {
              expect(spy.calls.length).toEqual(1);
              expect(spy.calls[0].arguments).toEqual([event.message]);
              done();
            } catch (error) {
              done(error);
            }
          }).andCallThrough();
          stream.subscribe(spy);
          subscription.pubnub.emit(`${pubnubConfig.userChannelGroup}:message`, event);
        });
    });

    it('should call onComplete callback when the subscription is unsubscribed', function(done) {
      const activeUser = User.getActiveUser();
      const collection = randomString();
      const pubnubConfig = {
        subscribeKey: randomString(),
        publishKey: randomString(),
        authKey: activeUser.authtoken,
        userChannelGroup: randomString()
      };
      const subscription = new LiveServiceSubscription(collection, pubnubConfig);

      nock(subscription.client.apiHostname)
        .post(`/appdata/${subscription.client.appKey}/${subscription.collection}/_subscribe`, { deviceId: subscription.client.deviceId })
        .reply(200);

      subscription.subscribe(pubnubConfig.userChannelGroup)
        .then((stream) => {
          const spy = expect.createSpy(() => {
            try {
              expect(spy.calls.length).toEqual(1);
              expect(spy.calls[0].arguments).toEqual([]);
              done();
            } catch (error) {
              done(error);
            }
          }).andCallThrough();
          stream.subscribe(null, null, spy);

          nock(subscription.client.apiHostname)
            .post(`/appdata/${subscription.client.appKey}/${collection}/_unsubscribe`, { deviceId: subscription.client.deviceId })
            .reply(200);
          subscription.unsubscribe();
        });
    });

    it('should call onStatus callback when a status event is received', function(done) {
      const activeUser = User.getActiveUser();
      const collection = randomString();
      const pubnubConfig = {
        subscribeKey: randomString(),
        publishKey: randomString(),
        authKey: activeUser.authtoken,
        userChannelGroup: randomString()
      };
      const subscription = new LiveServiceSubscription(collection, pubnubConfig);

      nock(subscription.client.apiHostname)
        .post(`/appdata/${subscription.client.appKey}/${subscription.collection}/_subscribe`, { deviceId: subscription.client.deviceId })
        .reply(200);

      subscription.subscribe(pubnubConfig.userChannelGroup)
        .then((stream) => {
          const event = 'Connected';
          const spy = expect.createSpy(() => {
            try {
              expect(spy.calls.length).toEqual(1);
              expect(spy.calls[0].arguments).toEqual([event]);
              done();
            } catch (error) {
              done(error);
            }
          }).andCallThrough();
          stream.subscribe(null, null, null, spy);
          subscription.pubnub.emit(`${pubnubConfig.userChannelGroup}:status`, event);
        });
    });

    it('should call onPresence callback when a presence event is received', function(done) {
      const activeUser = User.getActiveUser();
      const collection = randomString();
      const pubnubConfig = {
        subscribeKey: randomString(),
        publishKey: randomString(),
        authKey: activeUser.authtoken,
        userChannelGroup: randomString()
      };
      const subscription = new LiveServiceSubscription(collection, pubnubConfig);

      nock(subscription.client.apiHostname)
        .post(`/appdata/${subscription.client.appKey}/${subscription.collection}/_subscribe`, { deviceId: subscription.client.deviceId })
        .reply(200);

      subscription.subscribe(pubnubConfig.userChannelGroup)
        .then((stream) => {
          const event = { active: 'join', occupancy: 1 };
          const spy = expect.createSpy(() => {
            try {
              expect(spy.calls.length).toEqual(1);
              expect(spy.calls[0].arguments).toEqual([event]);
              done();
            } catch (error) {
              done(error);
            }
          }).andCallThrough();
          stream.subscribe(null, null, null, null, spy);
          subscription.pubnub.emit(`${pubnubConfig.userChannelGroup}:presence`, event);
        });
    });
  });
});
