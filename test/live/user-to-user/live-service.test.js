import expect from 'expect';
import Proxyquire from 'proxyquire';

import { randomString } from 'src/utils';
import { UserMock } from 'test/mocks';

// import Kinvey from '../../../src/kinvey';
import { getLiveService, getLiveServiceFacade } from '../../../src/live';
import { PubNubListener } from '../../../src/live';
import * as mock from './nock-helper';
import {
  PubNubClientMock,
  PubNubListenerMock,
  MockBase as Mock
} from '../../mocks';

const pathToLiveService = '../../../src/live/src/user-to-user/live-service';
const proxyquire = Proxyquire.noCallThru();
const proxyrequireMocks = {
  pubnub: PubNubClientMock
};

function addProxyrequireMock(path, mock) {
  proxyrequireMocks[path] = mock;
}

function removeProxyrequireMock(path) {
  delete proxyrequireMocks[path];
}

describe.only('LiveService', () => {
  let liveService;

  before(function () {
    mock.setClient(this.client);
  });

  beforeEach(() => {
    // use proxyquire here so a new instance is created every time (avoid singleton state)
    const getMockedLiveService = proxyquire(pathToLiveService, proxyrequireMocks).getLiveService;
    liveService = getMockedLiveService();
  });

  it('should be a singleton', () => {
    const liveService1 = getLiveService();
    const liveService2 = getLiveService();
    expect(liveService1 === liveService2).toBe(true);
  });

  it('should not be initialized by default', () => {
    expect(liveService.isInitialized()).toBe(false);
  });

  describe('registration', () => {
    let nockScope;
    let pubnubConfig;

    beforeEach(() => {
      pubnubConfig = {
        publishKey: randomString(),
        subscribeKey: randomString(),
        userChannelGroup: randomString()
      };
      nockScope = mock.mockRegisterRealtimeCall(pubnubConfig);
    });

    it('should make a call to /register endpoint for live service', () => {
      return liveService.register()
        .then(() => {
          nockScope.done();
        });
    });

    it('should initialize PubNub client with received settings', () => {
      return liveService.register()
        .then(() => {
          const usedConfig = liveService._pubnubClient.config;
          expect(usedConfig.publishKey).toEqual(pubnubConfig.publishKey);
          expect(usedConfig.subscribeKey).toEqual(pubnubConfig.subscribeKey);
          expect(liveService._userChannelGroup).toEqual(pubnubConfig.userChannelGroup);
        });
    });

    it('should pass a PubNubListener instance to PubNub client', () => {
      return liveService.register()
        .then(() => {
          expect(liveService._pubnubClient.listeners.length).toBe(1);
          expect(liveService._pubnubClient.listeners[0]).toBeA(PubNubListener);
        });
    });

    it('should be reflected in its isInitialized() method', () => {
      expect(liveService.isInitialized()).toBe(false);
      return liveService.register()
        .then(() => {
          expect(liveService.isInitialized()).toBe(true);
        });
    });

    it('should subscribe to the provided user channel group', () => {
      return liveService.register()
        .then(() => {
          expect(Object.keys(liveService._pubnubClient.subObj).length).toBe(1);
          expect(liveService._pubnubClient.subObj.channelGroups.length).toBe(1);
          expect(liveService._pubnubClient.subObj.channelGroups[0]).toEqual(pubnubConfig.userChannelGroup);
        });
    });
  });

  describe('unregistration', () => {
    let nockScope;
    let pubnubClientMockId = randomString();
    let pubnubListenerMockId = randomString();

    before(() => {
      addProxyrequireMock('./pubnub-listener', { PubNubListener: PubNubListenerMock });
    });

    beforeEach(() => {
      let pubnubConfig = {
        publishKey: randomString(),
        subscribeKey: randomString(),
        userChannelGroup: randomString()
      };
      mock.mockRegisterRealtimeCall(pubnubConfig);
      nockScope = mock.mockUnregisterRealtimeCall();
      return liveService.register()
        .then(() => {
          liveService._pubnubClient.mockId = pubnubClientMockId;
          liveService._pubnubListener.mockId = pubnubListenerMockId;
          Mock.resetCalledMethods();
        });
    });

    after(() => {
      removeProxyrequireMock('./pubnub-listener');
    });

    it('should call unregister endpoint for live service', () => {
      return liveService.unregister()
        .then(() => {
          nockScope.done();
        });
    });

    it('should unregister from all PubNub subscriptions', () => {
      expect(Mock.methodWasCalled(pubnubClientMockId, 'unsubscribeAll')).toBe(false);
      return liveService.unregister()
        .then(() => {
          expect(Mock.methodWasCalled(pubnubClientMockId, 'unsubscribeAll')).toBe(true);
        });
    });

    it('should remove all listeners from PubNubListener events', () => {
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'removeAllListeners')).toBe(false);
      return liveService.unregister()
        .then(() => {
          expect(Mock.methodWasCalled(pubnubListenerMockId, 'removeAllListeners')).toBe(true);
        });
    });

    it('should be reflected in its isInitialized() method', () => {
      expect(liveService.isInitialized()).toBe(true);
      return liveService.unregister()
        .then(() => {
          expect(liveService.isInitialized()).toBe(false);
        });
    });
  });

  describe('global PubNub status events', () => {
    let pubnubListenerMockId;

    before(() => {
      addProxyrequireMock('./pubnub-listener', { PubNubListener: PubNubListenerMock });
    });

    beforeEach(() => {
      mock.mockRegisterRealtimeCall();
      pubnubListenerMockId = randomString();
      return liveService.register()
        .then(() => {
          liveService._pubnubListener.mockId = pubnubListenerMockId;
          Mock.resetCalledMethods();
        });
    });

    after(() => {
      removeProxyrequireMock('./pubnub-listener');
    });

    it('should be received by attaching a handler', () => {
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'on')).toBe(false);
      liveService.onConnectionStatusUpdates(() => { });
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'on')).toBe(true);
    });

    it('should be ignored if handler is removed', () => {
      const handler = () => { };
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'on')).toBe(false);
      liveService.onConnectionStatusUpdates(handler);
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'on')).toBe(true);
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'removeListener')).toBe(false);
      liveService.offConnectionStatusUpdates(handler);
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'removeListener')).toBe(true);
    });

    it('should be ignored if all handlers are removed', () => {
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'on')).toBe(false);
      liveService.onConnectionStatusUpdates(() => { });
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'on')).toBe(true);
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'removeAllListeners')).toBe(false);
      liveService.offConnectionStatusUpdates();
      expect(Mock.methodWasCalled(pubnubListenerMockId, 'removeAllListeners')).toBe(true);
    });
  });

  describe('user-facing facade', () => {
    let liveServiceFacade;

    beforeEach(() => {
      liveServiceFacade = getLiveServiceFacade();
    });

    it('should be a singleton', () => {
      const facade2 = getLiveServiceFacade();
      expect(liveServiceFacade === facade2).toBe(true);
    });

    it('should have only the user-facing methods of LiveService', () => {
      expect(Object.keys(liveServiceFacade).length).toBe(5);
      expect('register' in liveServiceFacade).toBe(true);
      expect('unregister' in liveServiceFacade).toBe(true);
      expect('onConnectionStatusUpdates' in liveServiceFacade).toBe(true);
      expect('offConnectionStatusUpdates' in liveServiceFacade).toBe(true);
      expect('unsubscribeFromAll' in liveServiceFacade).toBe(true);
    });
  });
});
