import expect from 'expect';

import { randomString } from 'src/utils';
import { UserMock } from 'test/mocks';

import Kinvey from '../../../src/kinvey';
import { PubNubListener, getLiveService } from '../../../src/live';
import * as nockHelper from './nock-helper';
import {
  PubNubClientMock,
  PubNubListenerMock
} from '../../mocks';

const pathToLiveService = '../../../src/live/src/user-to-user/live-service';
const notInitializedCheckRegexp = new RegExp('not.*initialized', 'i');
const invalidOrMissingCheckRegexp = new RegExp('(invalid)|(missing)', 'i');

describe.only('LiveService', () => {
  let client;
  let liveService;
  let pubnubConfig;

  before(function () {
    nockHelper.setClient(this.client);
    client = this.client;
  });

  beforeEach(() => {
    pubnubConfig = {
      publishKey: randomString(),
      subscribeKey: randomString(),
      userChannelGroup: randomString()
    };

    // we want to clear the state of the singleton
    delete require.cache[require.resolve(pathToLiveService)];
    liveService = require(pathToLiveService).getLiveService();
  });

  afterEach(() => {
    expect.restoreSpies();
  });

  it('should be a singleton', () => {
    const liveService1 = getLiveService();
    const liveService2 = getLiveService();
    expect(liveService1 === liveService2).toBe(true);
  });

  it('should not be initialized by default', () => {
    expect(liveService.isInitialized()).toBe(false);
  });

  describe('user registration', () => {
    it('should return an error if no user is passed to registerUser', (done) => {
      liveService.registerUser()
        .then(() => done(new Error('registerUser() succeeded without active user')))
        .catch((err) => {
          expect(err.message).toEqual('Missing or invalid active user');
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it('should return an error if a user other than the active user is passed to registerUser', (done) => {
      liveService.registerUser(new Kinvey.User())
        .then(() => done(new Error('registerUser() succeeded without active user')))
        .catch((err) => {
          expect(err.message).toEqual('Missing or invalid active user');
          done();
        });
    });

    it('should call /register endpoint for live service', () => {
      const nockScope = nockHelper.mockRegisterRealtimeCall();
      return liveService.registerUser(Kinvey.User.getActiveUser())
        .then(() => {
          nockScope.done();
        });
    });

    it('should should not put LiveService in an initialized state', () => {
      const nockScope = nockHelper.mockRegisterRealtimeCall();
      return liveService.registerUser(Kinvey.User.getActiveUser())
        .then(() => {
          expect(liveService.isInitialized()).toBe(false);
          nockScope.done();
        });
    });
  });

  describe('initialization', () => {
    let pubnubClient;
    let pubnubListener;
    let nockScope;

    beforeEach(() => {
      nockScope = nockHelper.mockRegisterRealtimeCall(pubnubConfig);
      return liveService.registerUser(Kinvey.User.getActiveUser())
        .then((config) => {
          pubnubClient = new PubNubClientMock();
          pubnubListener = new PubNubListenerMock();
        });
    });

    afterEach(() => {
      nockScope.done();
    });

    it('should register a PubNubListener instance to PubNub client', () => {
      const addListenerSpy = expect.spyOn(pubnubClient, 'addListener');

      liveService.initialize(pubnubClient, pubnubListener);
      expect(addListenerSpy).toHaveBeenCalledWith(pubnubListener);
    });

    it('should be reflected in its isInitialized() method', () => {
      liveService.initialize(pubnubClient, pubnubListener);
      expect(liveService.isInitialized()).toBe(true);
    });

    it('should subscribe to the provided user channel group', () => {
      const spy = expect.spyOn(pubnubClient, 'subscribe');
      liveService.initialize(pubnubClient, pubnubListener);
      expect(spy).toHaveBeenCalledWith({ channelGroups: [pubnubConfig.userChannelGroup] });
    });
  });

  describe('subscribing', () => {
    it('should throw an error if no channel name is passed', () => {
      expect(() => {
        liveService.subscribeToChannel(null, { onMessage: () => { } });
      })
        .toThrow(invalidOrMissingCheckRegexp);
    });

    it('should throw an error if no receiver is passed', () => {
      expect(() => {
        liveService.subscribeToChannel('channelName');
      })
        .toThrow(invalidOrMissingCheckRegexp);
    });

    it('should throw an error if receiver with no relevant methods is passed', () => {
      expect(() => {
        liveService.subscribeToChannel('channelName', { test: 1 });
      })
        .toThrow(invalidOrMissingCheckRegexp);
    });

    it('should throw an error if LiveService is not initialized', () => {
      expect(() => {
        liveService.subscribeToChannel('channelName', { onMessage: () => { } });
      })
        .toThrow(notInitializedCheckRegexp);
    });

    describe('when LiveService has been initialized', () => {
      const testChannelName = 'someChannel';
      let nockScope;
      let pubnubListener;
      let pubnubClient;

      beforeEach(() => {
        nockScope = nockHelper.mockRegisterRealtimeCall(pubnubConfig);
        return liveService.registerUser(Kinvey.User.getActiveUser())
          .then((config) => {
            pubnubClient = new PubNubClientMock(config);
            pubnubListener = new PubNubListenerMock();
            return liveService.initialize(pubnubClient, pubnubListener);
          });
      });

      afterEach(() => {
        nockScope.done();
      });

      it('should add listener to PubNubListener\'s events for the specified channel, if onMessage callback is provided', () => {
        const spy = expect.spyOn(pubnubListener, 'on');
        const receiver = { onMessage: () => { } };
        liveService.subscribeToChannel(testChannelName, receiver);
        expect(spy.calls.length).toEqual(1);
        expect(spy).toHaveBeenCalledWith(testChannelName, receiver.onMessage);
      });

      it('should add listener to PubNubListener\'s events for the specified channel, if onStatus or onError callback is provided', () => {
        const spy = expect.spyOn(pubnubListener, 'on');
        const receiver = { onMessage: () => { }, onError: () => { } };
        liveService.subscribeToChannel(testChannelName, receiver);
        expect(spy.calls.length).toEqual(2);
        expect(spy.calls[1].arguments[0]).toEqual(`${PubNubListener.statusPrefix}${testChannelName}`);
      });

      it('should not call "subscribe()" of PubNub client instance', () => {
        const spy = expect.spyOn(pubnubClient, 'subscribe');
        liveService.subscribeToChannel(testChannelName, { onMessage: () => { } });
        expect(spy).toNotHaveBeenCalled();
      });
    });
  });

  describe('publishing', () => {
    const testChannelName = 'someChannel';
    let pubnubClient;
    let pubnubListener;
    let nockScope;

    beforeEach(() => {
      nockScope = nockHelper.mockRegisterRealtimeCall(pubnubConfig);
      return liveService.registerUser(Kinvey.User.getActiveUser())
        .then((config) => {
          pubnubClient = new PubNubClientMock();
          pubnubListener = new PubNubListenerMock();
          return liveService.initialize(pubnubClient, pubnubListener);
        });
    });

    afterEach(() => {
      nockScope.done();
    });

    describe('correctly', () => {
      it('should call publish of PubNub client correctly', () => {
        const publishSpy = expect.spyOn(pubnubClient, 'publish')
          .andReturn(Promise.resolve());

        return liveService.publishToChannel(testChannelName, { test: 1 })
          .then(() => {
            expect(publishSpy.calls.length).toEqual(1);
            const arg = publishSpy.calls[0].arguments[0];
            expect(arg).toExist();
            expect(arg.message).toExist();
            expect(arg.channel).toEqual(testChannelName);
          });
      });

      it('should add a "senderId" property, set to active user\'s _id, when sending an object', () => {
        const publishSpy = expect.spyOn(pubnubClient, 'publish')
          .andReturn(Promise.resolve());

        return liveService.publishToChannel(testChannelName, { test: 1 })
          .then(() => {
            expect(publishSpy.calls.length).toEqual(1);
            const arg = publishSpy.calls[0].arguments[0];
            expect(arg.message.test).toEqual(1);
            expect(arg.message.senderId).toEqual(client.activeUser._id);
          });
      });
    });

    describe('incorrectly', () => {
      it('should return an error when LiveService is not initialized', (done) => {
        liveService.uninitialize()
        expect(liveService.isInitialized()).toBe(false);

        liveService.publishToChannel('someChannel', { test: 1 })
          .then(() => done(new Error('publishToChannel() succeeded with LiveService uninitialized')))
          .catch((err) => {
            expect(err.message).toEqual('Live service is not initialized');
            done();
          })
          .catch((err) => {
            done(err);
          });
      });

      it('should return error if channel name is invalid', (done) => {
        liveService.publishToChannel(null, { test: 1 })
          .then(() => done(new Error('publishToChannel() succeeded with invalid channel name')))
          .catch((err) => {
            expect(err.message).toEqual('Invalid channel name');
            done();
          })
          .catch((err) => done(err));
      });

      it('should return error if message is missing', (done) => {
        liveService.publishToChannel(testChannelName, undefined)
          .then(() => done(new Error('publishToChannel() succeeded with invalid message')))
          .catch((err) => {
            expect(err.message).toEqual('Missing or invalid message');
            done();
          })
          .catch((err) => done(err));
      });
    });
  });

  describe('unregistration', () => {
    let pubnubListener;
    let pubnubClient;

    it('should fail when no user is registered', (done) => {
      liveService.unregisterUser()
        .then(() => done(new Error('unregisterUser() succeeded with no registered user')))
        .catch((err) => {
          expect(err.message).toEqual('Cannot unregister when no user has been registered for live service');
          done();
        })
        .catch((err) => done(err));
    });

    describe('when user is registered', () => {
      let nockScope;

      beforeEach(() => {
        nockScope = nockHelper.mockRegisterRealtimeCall(pubnubConfig);
        return liveService.registerUser(Kinvey.User.getActiveUser())
          .then((config) => {
            nockHelper.mockUnregisterRealtimeCall();
            pubnubClient = new PubNubClientMock();
            pubnubListener = new PubNubListenerMock();
            return liveService.initialize(pubnubClient, pubnubListener);
          });
      });

      afterEach(() => {
        nockScope.done();
      });

      it('should call unregister endpoint for live service', () => {
        return liveService.unregisterUser()
          .then(() => {
            nockScope.done();
          });
      });

      it('should be reflected in its isInitialized() method', () => {
        expect(liveService.isInitialized()).toBe(true);
        return liveService.unregisterUser()
          .then(() => {
            expect(liveService.isInitialized()).toBe(false);
          });
      });
    });
  });

  describe('uninitialization', () => {
    let nockScope;
    let pubnubClient;
    let pubnubListener;

    beforeEach(() => {
      nockScope = nockHelper.mockRegisterRealtimeCall();
      return liveService.registerUser(Kinvey.User.getActiveUser())
        .then((config) => {
          pubnubClient = new PubNubClientMock(config);
          pubnubListener = new PubNubListenerMock();
          return liveService.initialize(pubnubClient, pubnubListener);
        });
    });

    afterEach(() => {
      nockScope.done();
    });

    it('should unregister from all PubNub subscriptions', () => {
      const spy = expect.spyOn(pubnubClient, 'unsubscribeAll');
      expect(spy).toNotHaveBeenCalled();
      liveService.uninitialize();
      expect(spy).toHaveBeenCalled();
    });

    it('should remove all listeners from PubNubListener events', () => {
      const spy = expect.spyOn(pubnubListener, 'removeAllListeners');
      expect(spy).toNotHaveBeenCalled();
      liveService.uninitialize();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('global PubNub status event handlers', () => {
    let pubnubClient;
    let pubnubListener;
    let nockScope;

    beforeEach(() => {
      nockScope = nockHelper.mockRegisterRealtimeCall();
      return liveService.registerUser(Kinvey.User.getActiveUser())
        .then((config) => {
          pubnubClient = new PubNubClientMock(config);
          pubnubListener = new PubNubListenerMock();
          return liveService.initialize(pubnubClient, pubnubListener);
        });
    });

    afterEach(() => {
      nockScope.done();
    });

    it('should be attachable to PubNubListener', () => {
      const handler = () => { };
      const spy = expect.spyOn(pubnubListener, 'on');
      liveService.onConnectionStatusUpdates(handler);
      expect(spy.calls.length).toBe(1);
      expect(spy).toHaveBeenCalledWith(PubNubListener.unclassifiedEvents, handler);
    });

    describe('when attached', () => {
      let handler;

      beforeEach(() => {
        handler = () => { };
        liveService.onConnectionStatusUpdates(handler);
      });

      it('should be detachable from PubNubListener, when specified', () => {
        const offSpy = expect.spyOn(pubnubListener, 'removeListener');
        liveService.offConnectionStatusUpdates(handler);
        expect(offSpy).toHaveBeenCalledWith(PubNubListener.unclassifiedEvents, handler);
      });

      it('should all be detached from PubNubListener, if no specific handler is specified', () => {
        const offSpy = expect.spyOn(pubnubListener, 'removeAllListeners');
        liveService.offConnectionStatusUpdates();
        expect(offSpy).toHaveBeenCalledWith(PubNubListener.unclassifiedEvents);
      });
    });
  });

  describe('user-facing facade', () => {
    it('should have only the user-facing methods of LiveService', () => {
      const facadeMethods = [
        'register',
        'unregister',
        'onConnectionStatusUpdates',
        'offConnectionStatusUpdates',
        'unsubscribeFromAll',
        'isInitialized'
      ];
      expect(Object.keys(Kinvey.LiveService).length).toBe(facadeMethods.length);
      expect(Kinvey.LiveService).toIncludeKeys(facadeMethods);
    });
  });
});
