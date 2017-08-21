import expect from 'expect';
import Proxyquire from 'proxyquire';
import PubNub from 'pubnub';

import Kinvey from '../../../src';
import { PubNubListener } from '../../../src/live';

const liveServiceMock = {
  registerUser: () => { },
  initialize: () => { },
  uninitialize: () => { },
  unregisterUser: () => { },
  onConnectionStatusUpdates: () => { },
  offConnectionStatusUpdates: () => { },
  unsubscribeFromAll: () => { },
  isInitialized: () => { }
};

const pathToFacade = '../../../src/live/src/user-to-user/live-service-facade';
const proxyquireMocks = { './live-service': { getLiveService: () => liveServiceMock } };
const proxyquire = Proxyquire.noCallThru();

describe('LiveServiceFacade', () => {
  let LiveServiceFacade;

  beforeEach(() => {
    // avoid LiveService singleton state
    LiveServiceFacade = proxyquire(pathToFacade, proxyquireMocks).LiveServiceFacade;;
  });

  afterEach(() => {
    expect.restoreSpies();
  });

  it('should have only user-facing LiveService methods', () => {
    const expectedMethods = [
      'register',
      'unregister',
      'onConnectionStatusUpdates',
      'offConnectionStatusUpdates',
      'unsubscribeFromAll',
      'isInitialized'
    ];
    expect(LiveServiceFacade).toContainKeys(expectedMethods);
  });

  describe('register', () => {
    it('should call LiveService\'s registerUser() and initialize() methods', () => {
      const initializeSpy = expect.spyOn(liveServiceMock, 'initialize');
      const registerUserSpy = expect.spyOn(liveServiceMock, 'registerUser')
        .andReturn(Promise.resolve({}));

      return LiveServiceFacade.register()
        .then((resp) => {
          expect(registerUserSpy).toHaveBeenCalledWith(Kinvey.User.getActiveUser());
          expect(initializeSpy.calls.length).toBe(1);
          expect(initializeSpy.calls[0].arguments[0]).toBeA(PubNub);
          expect(initializeSpy.calls[0].arguments[1]).toBeA(PubNubListener);
        });
    });
  });

  describe('unregister', () => {
    it('should call LiveService\'s unregisterUser() and uninitialize() methods', () => {
      const uninitSpy = expect.spyOn(liveServiceMock, 'uninitialize');
      const unregisterUserSpy = expect.spyOn(liveServiceMock, 'unregisterUser')
        .andReturn(Promise.resolve({}));

      return LiveServiceFacade.unregister();
    });
  });

  describe('onConnectionStatusUpdates', () => {
    it('should call LiveService\'s onConnectionStatusUpdates() method with the passed function', () => {
      const spy = expect.spyOn(liveServiceMock, 'onConnectionStatusUpdates');
      const handler = () => { };
      LiveServiceFacade.onConnectionStatusUpdates(handler);
      expect(spy).toHaveBeenCalledWith(handler);
    });
  });

  describe('offConnectionStatusUpdates', () => {
    it('should call LiveService\'s offConnectionStatusUpdates() method with the passed function', () => {
      const spy = expect.spyOn(liveServiceMock, 'offConnectionStatusUpdates');
      const handler = () => { };
      LiveServiceFacade.offConnectionStatusUpdates(handler);
      expect(spy).toHaveBeenCalledWith(handler);
    });
  });

  describe('unsubscribeFromAll', () => {
    it('should call LiveService\'s unsubscribeFromAll() method', () => {
      const spy = expect.spyOn(liveServiceMock, 'unsubscribeFromAll');
      LiveServiceFacade.unsubscribeFromAll();
      expect(spy).toHaveBeenCalled();
      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0].arguments.length).toBe(0);
    });
  });

  describe('isInitialized', () => {
    it('should call LiveService\'s isInitialized() method', () => {
      const spy = expect.spyOn(liveServiceMock, 'isInitialized');
      LiveServiceFacade.isInitialized();
      expect(spy).toHaveBeenCalled();
      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0].arguments.length).toBe(0);
    });
  });
});
